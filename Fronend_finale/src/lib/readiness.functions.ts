import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  HR_RECORDS,
  scoreAssessment,
  type Assessment,
  type CheckIn,
  type HrRecord,
} from "./personnel-data";
import { assessViaMlEngine } from "./ml-engine-client";

const store = new Map<string, Assessment>();

/**
 * Tries the real ML Engine (XGBoost + SHAP + VADER) first; falls back to
 * the local rule-based formula if the Python service is unreachable, slow,
 * or errors -- so a dead ML service never breaks the check-in flow (e.g.
 * mid-demo). engineSource on the returned Assessment tells the frontend
 * (and you, while debugging) which path actually produced the result.
 */
async function scoreWithMlEngineOrFallback(
  serviceId: string,
  record: HrRecord,
  checkIn: CheckIn,
  submittedAt: string,
): Promise<Assessment> {
  try {
    return await assessViaMlEngine(serviceId, record, checkIn);
  } catch (err) {
    console.error("[ml-engine] falling back to local scoring:", err);
    return { record, checkIn, submittedAt, ...scoreAssessment(record, checkIn) };
  }
}

const SEED: Array<{ serviceId: string; checkIn: CheckIn }> = [
  {
    serviceId: "PC-2041-88",
    checkIn: {
      stress: 8,
      recovery: "fatigued",
      workload: "highly",
      note: "Slept 2h, family matter pending at home.",
    },
  },
  {
    serviceId: "PC-2041-72",
    checkIn: {
      stress: 6,
      recovery: "partial",
      workload: "slightly",
      note: "Long crowd-control duty but managing.",
    },
  },
  {
    serviceId: "PC-2041-55",
    checkIn: {
      stress: 4,
      recovery: "partial",
      workload: "manageable",
      note: "",
    },
  },
  {
    serviceId: "PC-2041-31",
    checkIn: { stress: 2, recovery: "yes", workload: "manageable", note: "Rested and ready." },
  },
  {
    serviceId: "PC-2041-19",
    checkIn: {
      stress: 6,
      recovery: "partial",
      workload: "slightly",
      note: "Night rotations are hard, poor sleep.",
    },
  },
  {
    serviceId: "PC-2041-04",
    checkIn: { stress: 3, recovery: "yes", workload: "manageable", note: "" },
  },
];

function build(record: HrRecord, checkIn: CheckIn, submittedAt: string): Assessment {
  return { record, checkIn, submittedAt, ...scoreAssessment(record, checkIn) };
}

function ensureSeed() {
  if (store.size > 0) return;
  for (const s of SEED) {
    const record = HR_RECORDS.find((r) => r.serviceId === s.serviceId)!;
    store.set(
      record.serviceId,
      build(record, s.checkIn, new Date(Date.now() - 3600_000).toISOString()),
    );
  }
}

export const lookupPersonnel = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ serviceId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const id = data.serviceId.trim().toUpperCase();
    const record = HR_RECORDS.find((r) => r.serviceId.toUpperCase() === id) ?? null;
    return { record };
  });

export const listServiceIds = createServerFn({ method: "GET" }).handler(async () =>
  HR_RECORDS.map((r) => ({ serviceId: r.serviceId, name: r.name })),
);

export const submitCheckIn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        serviceId: z.string(),
        stress: z.number().min(1).max(10),
        recovery: z.enum(["yes", "partial", "fatigued"]),
        workload: z.enum(["manageable", "slightly", "highly"]),
        note: z.string().max(1000).default(""),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    ensureSeed();
    const record = HR_RECORDS.find(
      (r) => r.serviceId.toUpperCase() === data.serviceId.trim().toUpperCase(),
    );
    if (!record) throw new Error("Unknown service ID");
    const checkIn: CheckIn = {
      stress: data.stress,
      recovery: data.recovery,
      workload: data.workload,
      note: data.note,
    };
    const assessment = await scoreWithMlEngineOrFallback(
      record.serviceId,
      record,
      checkIn,
      new Date().toISOString(),
    );
    store.set(record.serviceId, assessment);
    return assessment;
  });

export const listAssessments = createServerFn({ method: "GET" }).handler(async () => {
  ensureSeed();
  // Commander view: personnel names are never sent, only masked placeholders.
  return [...store.values()]
    .sort((a, b) => b.score - a.score)
    .map((a) => ({ ...a, record: { ...a.record, name: a.record.name.replace(/[^\s.]/g, "*") } }));
});

export const applyAction = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        serviceId: z.string(),
        action: z.enum(["approve_leave", "rotate_duty", "restrict_nights"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    ensureSeed();
    const current = store.get(data.serviceId);
    if (!current) throw new Error("No assessment on file");
    const record = { ...current.record };
    if (data.action === "approve_leave") {
      record.leavesPending = 0;
      record.leavesDenied = 0;
    }
    if (data.action === "rotate_duty") {
      record.role = "Station Diary / Admin";
      record.highIntensity = false;
    }
    if (data.action === "restrict_nights") {
      record.dutySchedule = "Day only · 3 cycles";
      record.nightCycles = 0;
      record.avgSleepHours = Math.min(7.5, record.avgSleepHours + 1.5);
    }
    const updated = await scoreWithMlEngineOrFallback(
      record.serviceId,
      record,
      current.checkIn,
      current.submittedAt,
    );
    store.set(record.serviceId, updated);
    return updated;
  });
