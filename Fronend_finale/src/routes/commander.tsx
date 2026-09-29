import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ConsoleHeader } from "@/components/ConsoleHeader";
import { DriverBars, bandChip, bandText } from "@/components/risk";
import { BAND_LABEL, type Assessment } from "@/lib/personnel-data";
import { applyAction, listAssessments } from "@/lib/readiness.functions";
import { maskName, useRequireRole } from "@/lib/session";

export const Route = createFileRoute("/commander")({
  head: () => ({
    meta: [
      { title: "Commander Dashboard — RakshaMitra Readiness Console" },
      {
        name: "description",
        content:
          "Unit-level burnout risk board with red-zone alerts, explainable risk drivers and duty rotation, leave escalation and shift rebalancing actions.",
      },
      { property: "og:title", content: "Commander Dashboard — RakshaMitra" },
      {
        property: "og:description",
        content:
          "Monitor unit burnout risk and act on duty rotation, leave escalation and night-shift restriction recommendations.",
      },
    ],
  }),
  component: CommanderPage,
});

function CommanderPage() {
  const { session, ready } = useRequireRole("commander");
  const fetchAll = useServerFn(listAssessments);
  const act = useServerFn(applyAction);
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["assessments"],
    queryFn: () => fetchAll(),
    refetchInterval: 5000,
    enabled: ready,
  });

  const action = useMutation({
    mutationFn: (vars: { serviceId: string; action: "approve_leave" | "rotate_duty" | "restrict_nights" }) =>
      act({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessments"] }),
  });

  const selected: Assessment | null =
    rows.find((r) => r.record.serviceId === selectedId) ?? rows[0] ?? null;

  const count = (fn: (a: Assessment) => boolean) => rows.filter(fn).length;

  if (!ready) return <main className="min-h-screen bg-ink" />;

  return (
    <main className="min-h-screen bg-ink font-display text-paper antialiased selection:bg-accent-gold/30">
      <ConsoleHeader session={session} />

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-6 py-6 xl:grid-cols-12">
        <section className="xl:col-span-8">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-flag">
              Unit Risk Summary
            </h1>
            <span className="font-mono text-[10px] text-muted-ink">
              Sector 07 · {rows.length} active
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-line bg-panel p-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-low lamp-slow" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-ink">
                  Low
                </span>
              </div>
              <p className="mt-2 font-mono text-3xl font-semibold">
                {String(count((a) => a.band === "low")).padStart(2, "0")}
              </p>
              <p className="font-mono text-[11px] text-muted-ink">score &lt; 40</p>
            </div>
            <div className="rounded-lg border border-line bg-panel p-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-mid lamp-slow" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-ink">
                  Elevated
                </span>
              </div>
              <p className="mt-2 font-mono text-3xl font-semibold">
                {String(count((a) => a.band === "elevated" || a.band === "high")).padStart(2, "0")}
              </p>
              <p className="font-mono text-[11px] text-muted-ink">score 40-80</p>
            </div>
            <div className="rounded-lg border border-red-alert/40 bg-red-alert/10 p-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-red-alert lamp" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-red-alert">
                  Red zone
                </span>
              </div>
              <p className="mt-2 font-mono text-3xl font-semibold text-red-alert">
                {String(count((a) => a.band === "red")).padStart(2, "0")}
              </p>
              <p className="font-mono text-[11px] text-red-alert/70">score &gt; 80</p>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-line bg-panel">
            <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.9fr] gap-2 border-b border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-ink">
              <span>Personnel</span>
              <span className="text-right">Score</span>
              <span className="text-right">Trend</span>
              <span className="text-right">Status</span>
            </div>
            {rows.map((a) => {
              const isSel = selected?.record.serviceId === a.record.serviceId;
              return (
                <button
                  key={a.record.serviceId}
                  type="button"
                  onClick={() => setSelectedId(a.record.serviceId)}
                  className={`grid w-full grid-cols-[1.6fr_0.8fr_0.8fr_0.9fr] items-center gap-2 border-b border-line/60 px-4 py-3 text-left transition-colors duration-200 last:border-b-0 ${
                    a.band === "red" ? "bg-red-alert/5" : ""
                  } ${isSel ? "bg-elev" : "hover:bg-elev/60"}`}
                >
                  <div>
                    <p className="font-mono text-sm font-semibold tracking-wider">{maskName(a.record.name)}</p>
                    <p className="font-mono text-[10px] text-muted-ink">
                      {a.record.serviceId} · {a.record.role}
                    </p>
                  </div>
                  <span className={`text-right font-mono text-lg font-semibold ${bandText[a.band]}`}>
                    {a.score}
                  </span>
                  <span
                    className={`text-right font-mono text-xs ${
                      a.record.trend > 0 ? "text-red-alert" : "text-muted-ink"
                    }`}
                  >
                    {a.record.trend > 0 ? `+${a.record.trend}` : a.record.trend}
                  </span>
                  <span
                    className={`justify-self-end rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${bandChip[a.band]}`}
                  >
                    {BAND_LABEL[a.band]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="xl:col-span-4">
          {selected && (
            <div className="rounded-xl border border-line bg-panel p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-flag">
                  Drill-down
                </h2>
                <span className="font-mono text-[10px] text-muted-ink">
                  {selected.record.serviceId}
                </span>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold tracking-wider">{maskName(selected.record.name)}</p>
                  <p className="font-mono text-[10px] text-muted-ink">
                    {selected.record.role} · {selected.record.dutySchedule}
                  </p>
                </div>
                <p className={`font-mono text-2xl font-semibold ${bandText[selected.band]}`}>
                  {selected.score}
                </p>
              </div>

              <div className="mb-5">
                <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-ink">
                  Risk drivers
                </p>
                <DriverBars drivers={selected.drivers} />
              </div>

              {selected.recommendation && (
                <div className="mb-3 rounded-lg border border-mid/40 bg-mid/10 p-3">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-mid">
                    ML Engine recommendation
                  </p>
                  <p className="text-xs leading-relaxed text-paper/85">{selected.recommendation}</p>
                </div>
              )}

              {selected.score > 80 && selected.record.leavesDenied > 0 && (
                <div className="mb-3 rounded-lg border border-red-alert/50 bg-red-alert/10 p-3 ring-1 ring-red-alert/20">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-red-alert lamp" />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-red-alert">
                      Critical overload
                    </span>
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-paper/85">
                    Officer has{" "}
                    <span className="font-semibold text-red-alert">
                      {selected.record.leavesDenied} denied leaves
                    </span>
                    . <span className="font-semibold">{selected.record.leavesPending} pending</span>{" "}
                    request found. Action required: approve immediately.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      action.mutate({
                        serviceId: selected.record.serviceId,
                        action: "approve_leave",
                      })
                    }
                    className="w-full rounded-md bg-low py-2 text-xs font-semibold text-ink transition-opacity duration-200 hover:opacity-90"
                  >
                    Approve leave now
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <div className="rounded-lg border border-line bg-ink/60 p-3">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-ink">
                    Duty rotation
                  </p>
                  <button
                    type="button"
                    disabled={!selected.record.highIntensity}
                    onClick={() =>
                      action.mutate({
                        serviceId: selected.record.serviceId,
                        action: "rotate_duty",
                      })
                    }
                    className="w-full rounded-md border border-line bg-elev py-2 text-[11px] font-medium text-paper transition-colors duration-200 hover:border-accent-gold hover:text-accent-gold disabled:opacity-40 disabled:hover:border-line disabled:hover:text-paper"
                  >
                    {selected.record.highIntensity
                      ? "Recommend: admin duty · 14 days"
                      : "Already on low-intensity duty"}
                  </button>
                </div>
                <div className="rounded-lg border border-line bg-ink/60 p-3">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-ink">
                    Shift rebalance
                  </p>
                  <button
                    type="button"
                    disabled={selected.record.nightCycles === 0}
                    onClick={() =>
                      action.mutate({
                        serviceId: selected.record.serviceId,
                        action: "restrict_nights",
                      })
                    }
                    className="w-full rounded-md border border-line bg-elev py-2 text-[11px] font-medium text-paper transition-colors duration-200 hover:border-accent-gold hover:text-accent-gold disabled:opacity-40 disabled:hover:border-line disabled:hover:text-paper"
                  >
                    {selected.record.nightCycles > 0
                      ? "Action: restrict night · 3 cycles"
                      : "Night shifts already restricted"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
