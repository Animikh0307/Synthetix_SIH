import { bandOf, type Assessment, type RiskDriver } from "@/lib/personnel-data";

export { bandOf };

export const bandText: Record<Assessment["band"], string> = {
  low: "text-low",
  elevated: "text-mid",
  high: "text-high",
  red: "text-red-alert",
};

export const bandBar: Record<Assessment["band"], string> = {
  low: "bg-low",
  elevated: "bg-mid",
  high: "bg-high",
  red: "bg-red-alert",
};

export const bandChip: Record<Assessment["band"], string> = {
  low: "border-low/40 bg-low/15 text-low",
  elevated: "border-mid/40 bg-mid/15 text-mid",
  high: "border-high/40 bg-high/15 text-high",
  red: "border-red-alert/40 bg-red-alert/15 text-red-alert",
};

export function DriverBars({ drivers }: { drivers: RiskDriver[] }) {
  return (
    <div className="space-y-2.5">
      {drivers.map((d) => {
        const band = bandOf(d.value);
        return (
          <div key={d.label}>
            <div className="mb-1 flex justify-between font-mono text-[11px] text-paper">
              <span>{d.label}</span>
              <span className={bandText[band]}>{d.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-elev">
              <div
                className={`h-full rounded-full ${bandBar[band]} ${band === "red" ? "lamp" : ""}`}
                style={{ width: `${d.value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
