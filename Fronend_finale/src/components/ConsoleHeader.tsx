import { useNavigate } from "@tanstack/react-router";
import { clearSession, type Session } from "@/lib/session";

export function ConsoleHeader({ session }: { session: Session | null }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center bg-accent-gold font-mono text-sm font-semibold text-ink">
            R
          </div>
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-paper">
              RAKSHAMITRA
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-ink">
              Readiness Command Console
            </p>
          </div>
        </div>

        {session && (
          <span className="rounded-full border border-line bg-panel px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-accent-gold">
            {session.role === "commander" ? "Commander" : "Personnel"} · {session.serviceId}
          </span>
        )}

        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-[11px] text-muted-ink md:inline">
            SECTOR 07 · COMMAND NODE
          </span>
          <span className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 font-mono text-[11px] text-paper">
            <span className="size-2 rounded-full bg-low lamp-slow" />
            ONLINE
          </span>
          <button
            type="button"
            onClick={() => {
              clearSession();
              navigate({ to: "/", replace: true });
            }}
            className="rounded-full border border-line bg-panel px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-ink transition-colors hover:border-accent-gold hover:text-accent-gold"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
