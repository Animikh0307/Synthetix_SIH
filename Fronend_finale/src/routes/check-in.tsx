import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ConsoleHeader } from "@/components/ConsoleHeader";
import { DriverBars, bandChip, bandText } from "@/components/risk";
import { type Assessment, type CheckIn, type HrRecord } from "@/lib/personnel-data";
import { lookupPersonnel, submitCheckIn } from "@/lib/readiness.functions";
import { useRequireRole } from "@/lib/session";

export const Route = createFileRoute("/check-in")({
  head: () => ({
    meta: [
      { title: "Personnel Check-in — RakshaMitra Readiness Console" },
      {
        name: "description",
        content:
          "Daily readiness check-in for uniformed personnel: service ID lookup, HR duty profile, stress rating and burnout risk scoring.",
      },
      { property: "og:title", content: "Personnel Check-in — RakshaMitra" },
      {
        property: "og:description",
        content:
          "Service ID lookup fuses HR duty data with a four-question check-in to compute a burnout risk score.",
      },
    ],
  }),
  component: CheckInPage,
});

const RECOVERY: Array<{ id: CheckIn["recovery"]; label: string }> = [
  { id: "yes", label: "Yes" },
  { id: "partial", label: "Partially" },
  { id: "fatigued", label: "Fatigued" },
];

const WORKLOAD: Array<{ id: CheckIn["workload"]; label: string }> = [
  { id: "manageable", label: "Manageable" },
  { id: "slightly", label: "Slightly" },
  { id: "highly", label: "Highly" },
];

function Choice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={
            value === o.id
              ? "rounded-md border border-accent-gold bg-accent-gold/15 px-2 py-2 text-center text-[11px] font-medium text-accent-gold"
              : "rounded-md border border-line bg-ink px-2 py-2 text-center text-[11px] text-muted-ink transition-colors duration-200 hover:border-accent-gold/50 hover:text-paper"
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function CheckInPage() {
  const { session, ready } = useRequireRole("personnel");
  const lookup = useServerFn(lookupPersonnel);
  const submit = useServerFn(submitCheckIn);

  const [serviceId, setServiceId] = useState("");
  const [record, setRecord] = useState<HrRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [stress, setStress] = useState(8);
  const [recovery, setRecovery] = useState<CheckIn["recovery"]>("fatigued");
  const [workload, setWorkload] = useState<CheckIn["workload"]>("highly");
  const [note, setNote] = useState("Slept 2h, family matter pending at home.");
  const [result, setResult] = useState<Assessment | null>(null);

  const fetchRecord = useMutation({
    mutationFn: (id: string) => lookup({ data: { serviceId: id } }),
    onSuccess: (r) => {
      setRecord(r.record);
      setNotFound(!r.record);
      setResult(null);
    },
  });

  useEffect(() => {
    if (session) {
      setServiceId(session.serviceId);
      fetchRecord.mutate(session.serviceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const send = useMutation({
    mutationFn: () =>
      submit({ data: { serviceId, stress, recovery, workload, note } }),
    onSuccess: (a) => setResult(a),
  });

  if (!ready) return <main className="min-h-screen bg-ink" />;

  return (
    <main className="min-h-screen bg-ink font-display text-paper antialiased selection:bg-accent-gold/30">
      <ConsoleHeader session={session} />

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-6 py-6 xl:grid-cols-12">
        <section className="xl:col-span-5">
          <div className="rounded-xl border border-line bg-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-flag">
                Personnel Check-in
              </h1>
              <span className="font-mono text-[10px] text-muted-ink">(a)</span>
            </div>

            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-ink">
              Service ID
            </label>
            <div className="mb-2 flex items-center gap-2 rounded-md border border-line bg-ink px-3 py-2.5">
              <input
                value={serviceId}
                readOnly
                className="w-full bg-transparent font-mono text-sm text-paper outline-none"
              />
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-accent-gold">
                {fetchRecord.isPending ? "…" : record ? "Verified" : ""}
              </span>
            </div>
            <p className="mb-4 font-mono text-[10px] text-muted-ink">
              Linked to your signed-in service ID.
            </p>

            {notFound && (
              <p className="mb-4 rounded-md border border-red-alert/40 bg-red-alert/10 px-3 py-2 font-mono text-[11px] text-red-alert">
                No HR record found for that service ID.
              </p>
            )}

            {record && (
              <div className="mb-5 rounded-lg border border-line bg-ink/60 p-4 rise">
                <div className="mb-3">
                  <p className="truncate text-sm font-semibold">{record.name}</p>
                  <p className="font-mono text-[11px] text-muted-ink">
                    {record.role} · {record.unit}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[11px]">
                  <div className="col-span-2 flex items-center justify-between border-b border-line/60 pb-2">
                    <dt className="text-muted-ink">Deployment</dt>
                    <dd>{record.deploymentDays} days</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-ink">Transfers</dt>
                    <dd>{record.transfers24m} · 24mo</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-ink">Leaves denied</dt>
                    <dd className={record.leavesDenied > 0 ? "text-red-alert" : ""}>
                      {record.leavesDenied}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-line/60 pt-2">
                    <dt className="text-muted-ink">Duty</dt>
                    <dd>{record.dutySchedule}</dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-line/60 pt-2">
                    <dt className="text-muted-ink">Pending</dt>
                    <dd>{record.leavesPending} leave</dd>
                  </div>
                  <div className="col-span-2 flex items-center justify-between border-t border-line/60 pt-2">
                    <dt className="text-muted-ink">Avg sleep</dt>
                    <dd>{record.avgSleepHours} h</dd>
                  </div>
                </dl>
              </div>
            )}

            <label className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-ink">
              <span>Stress level today</span>
              <span className="text-accent-gold">{stress} / 10</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={stress}
              onChange={(e) => setStress(Number(e.target.value))}
              className="mb-5 h-1.5 w-full appearance-none rounded-full bg-elev accent-accent-gold"
              style={{ accentColor: "var(--color-accent-gold)" }}
            />

            <div className="mb-4">
              <p className="mb-2 text-xs text-flag">Physically recovered from previous shift?</p>
              <Choice options={RECOVERY} value={recovery} onChange={setRecovery} />
            </div>

            <div className="mb-4">
              <p className="mb-2 text-xs text-flag">Current deployment workload?</p>
              <Choice options={WORKLOAD} value={workload} onChange={setWorkload} />
            </div>

            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-ink">
              Impacting readiness? (optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mb-4 w-full resize-none rounded-md border border-line bg-ink px-3 py-2 text-xs text-paper/90 outline-none focus:border-accent-gold/60"
            />

            <button
              type="button"
              disabled={!record || send.isPending}
              onClick={() => send.mutate()}
              className="w-full rounded-md bg-accent-gold py-2.5 text-sm font-semibold text-ink transition-opacity duration-200 disabled:opacity-40"
            >
              {send.isPending ? "Scoring…" : "Submit check-in"}
            </button>
            {!record && (
              <p className="mt-2 text-center font-mono text-[10px] text-muted-ink">
                Loading your HR record…
              </p>
            )}
          </div>
        </section>

        <section className="xl:col-span-7">
          {result ? (
            <div className="rise space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-line bg-panel px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-ink">
                      Computed burnout risk
                    </p>
                    <span
                      className={`rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${
                        result.engineSource === "ml-engine"
                          ? "border-low/40 bg-low/10 text-low"
                          : "border-mid/40 bg-mid/10 text-mid"
                      }`}
                      title={
                        result.engineSource === "ml-engine"
                          ? "Scored by the XGBoost + SHAP + VADER ML Engine"
                          : "ML Engine unreachable — scored by local fallback rules"
                      }
                    >
                      {result.engineSource === "ml-engine" ? "ML Engine" : "Fallback"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold">{result.record.name}</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-4xl font-semibold ${bandText[result.band]}`}>
                    {result.score}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${bandChip[result.band]}`}
                  >
                    {result.band === "red" ? "Red zone" : result.band}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-panel p-5">
                <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-ink">
                  Explainability · risk drivers
                </p>
                <DriverBars drivers={result.drivers} />
              </div>

              <div className="rounded-xl border border-line bg-panel p-5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-ink">
                  Sentiment analysis
                </p>
                <p className="text-xs leading-relaxed text-paper/85">
                  Free-text read as{" "}
                  <span
                    className={
                      result.sentiment === "negative" ? "font-semibold text-red-alert" : "font-semibold"
                    }
                  >
                    {result.sentiment}
                  </span>
                  {result.sentimentDelta !== 0 && (
                    <>
                      {" "}
                      · risk adjusted by{" "}
                      <span className="font-mono">
                        {result.sentimentDelta > 0 ? "+" : ""}
                        {result.sentimentDelta}
                      </span>
                    </>
                  )}
                  .
                </p>
              </div>

              {result.recommendation && (
                <div className="rounded-xl border border-mid/40 bg-mid/10 p-5">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-mid">
                    {result.requiresHumanReview
                      ? "Flagged for welfare officer review"
                      : "Suggested next step"}
                  </p>
                  <p className="text-xs leading-relaxed text-paper/85">{result.recommendation}</p>
                </div>
              )}

              <p className="font-mono text-[10px] text-muted-ink">
                Submitted {new Date(result.submittedAt).toLocaleTimeString()} · forwarded to the
                commander dashboard.
              </p>
            </div>
          ) : (
            <div className="grid h-full min-h-64 place-items-center rounded-xl border border-dashed border-line bg-panel/40 p-8">
              <p className="max-w-sm text-center font-mono text-[11px] leading-relaxed text-muted-ink">
                Answer the four prompts and submit. The computed burnout risk
                and its drivers appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
