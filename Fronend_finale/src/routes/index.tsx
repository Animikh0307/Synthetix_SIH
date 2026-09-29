import { MouseFlowBackground } from "@/components/3d/MouseFlowBackground";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { createAccount, signIn, type Role } from "@/lib/auth.functions";
import { homeFor, readSession, writeSession } from "@/lib/session";

import { Scene } from "@/components/3d/Scene";
import { FloatingShield } from "@/components/3d/FloatingShield";
import { ParticleField } from "@/components/3d/ParticleField";
import { HolographicGrid } from "@/components/3d/HolographicGrid";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [
      {
        rel: "icon",
        type: "image/png",
        href: "/rakshamitra-emblem.png",
      },
    ],

    meta: [
      {
        title: "RakshaMitra — Stress Care for Police Personnel",
      },
      {
        name: "description",
        content:
          "RakshaMitra is a confidential stress-reduction companion built exclusively for police officials.",
      },
      {
        property: "og:title",
        content: "RakshaMitra — Stress Care for Police Personnel",
      },
      {
        property: "og:description",
        content:
          "A confidential stress-reduction companion built exclusively for police officials.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),

  component: LoginPage,
});

const ROLES: Array<{
  id: Role;
  label: string;
  hint: string;
}> = [
  {
    id: "personnel",
    label: "Personnel",
    hint: "Daily readiness check-in",
  },
  {
    id: "commander",
    label: "Commander",
    hint: "Unit risk dashboard",
  },
];

function LoginPage() {
  const navigate = useNavigate();

  const login = useServerFn(signIn);
  const register = useServerFn(createAccount);

  const [role, setRole] = useState<Role>("personnel");
  const [mode, setMode] = useState<"signin" | "create">("signin");

  const [serviceId, setServiceId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  
  const [showServiceId, setShowServiceId] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [viewportWidth, setViewportWidth] = useState(0);
  
  useEffect(() => {
    const updateViewport = () => {
      setViewportWidth(window.innerWidth);
    };
  
    updateViewport();
    window.addEventListener("resize", updateViewport);
  
    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  useEffect(() => {
    const s = readSession();

    if (s) {
      navigate({
        to: homeFor(s.role),
        replace: true,
      });
    }
  }, [navigate]);

  const submit = useMutation({
    mutationFn: async () => {
      if (mode === "create" && password !== confirm) {
        throw new Error("Passwords do not match.");
      }

      const fn = mode === "create" ? register : login;

      const res = await fn({
        data: {
          role,
          serviceId,
          password,
        },
      });

      if (!res.ok) {
        throw new Error(res.error);
      }

      return res.session;
    },

    onSuccess: (session) => {
      writeSession(session);

      navigate({
        to: homeFor(session.role),
        replace: true,
      });
    },

    onError: (e: Error) => {
      setError(e.message);
    },
  });

  const idx = ROLES.findIndex((r) => r.id === role);
  const showDesktopShield = viewportWidth >= 1024;
  
  const desktopShield =
    viewportWidth >= 1536
      ? {
          scale: 0.74,
          position: [-1.75, -0.05, -0.85] as [number, number, number],
        }
      : viewportWidth >= 1280
        ? {
            scale: 0.68,
            position: [-1.55, -0.05, -0.8] as [number, number, number],
          }
        : {
            scale: 0.58,
            position: [-1.35, -0.05, -0.75] as [number, number, number],
          };

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink font-display text-paper antialiased selection:bg-accent-gold/30">
      {/* =========================================================
          3D ENVIRONMENT
          ========================================================= */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Soft ambient glow */}
        <div className="absolute left-[18%] top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-gold/5 blur-[120px]" />
      
        <div className="absolute right-[15%] top-[30%] h-[350px] w-[350px] rounded-full bg-low/5 blur-[120px]" />
      
        {/* NEW */}
        <MouseFlowBackground />
      
        {/* Three.js */}
        <Scene className="absolute inset-0">
          <ParticleField />
          <HolographicGrid />
      
          {showDesktopShield && (
            <FloatingShield
              scale={desktopShield.scale}
              position={desktopShield.position}
            />
          )}
        </Scene>
      </div>

      {/* =========================================================
          TOP STATUS BAR
          ========================================================= */}

      <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center overflow-hidden rounded-lg border border-accent-gold/40 bg-accent-gold/10">
            <img
              src="/rakshamitra-emblem.png"
              alt="RakshaMitra"
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em]">
              RAKSHAMITRA
            </p>

            <p className="text-[10px] uppercase tracking-wider text-muted-ink">
              Readiness Command Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-ink">
          <span className="size-2 rounded-full bg-low lamp-slow" />
          System Secure
        </div>
      </header>

      {/* =========================================================
          MAIN LOGIN ENVIRONMENT
          ========================================================= */}

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-90px)] w-full max-w-[1500px] items-center px-5 pb-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-12 xl:gap-20">
        {/* =====================================================
            LEFT / 3D HERO
            ===================================================== */}

        <section className="relative hidden min-h-[620px] items-center lg:flex">
          {/* Tactical corner markers */}
          <div className="absolute left-4 top-12 h-10 w-10 border-l border-t border-accent-gold/30" />

          <div className="absolute bottom-16 left-4 h-10 w-10 border-b border-l border-accent-gold/30" />

          <div className="absolute right-10 top-20 h-10 w-10 border-r border-t border-accent-gold/20" />

          {/* Hero copy */}
          <div className="relative z-10 ml-8 max-w-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold">
              Tactical Wellness Infrastructure
            </p>

            <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight xl:text-6xl">
              Calm strength
              <br />
              <span className="text-accent-gold">for those who serve.</span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-muted-ink">
              A confidential readiness companion designed to help personnel
              understand stress, recovery and operational wellbeing.
            </p>

            <div className="mt-8 flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-ink">
              <span>Private</span>
              <span className="h-1 w-1 rounded-full bg-accent-gold/60" />
              <span>Confidential</span>
              <span className="h-1 w-1 rounded-full bg-accent-gold/60" />
              <span>Secure</span>
            </div>
          </div>

          {/* 3D shield label */}
          
        </section>

        {/* =====================================================
            LOGIN PANEL
            ===================================================== */}

        <section className="relative mx-auto w-full max-w-md">
          {/* Mobile 3D hero */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="relative h-44 w-full">
              <Scene className="absolute inset-0">
                <ParticleField count={500} />
              
                <FloatingShield
                  scale={0.42}
                  position={[0, 0.05, 0]}
                />
              </Scene>
            </div>

            <p className="font-devanagari text-sm text-primary/90">
              रक्षामित्र
            </p>

            <h1 className="mt-2 text-2xl font-semibold">
              Raksha<span className="text-accent-gold">Mitra</span>
            </h1>

            <p className="mt-2 text-center text-xs text-muted-ink">
              Calm strength for those who serve
            </p>
          </div>

          {/* Login card */}
          <div className="glass-highlight glass-panel depth-shadow relative rounded-2xl border border-line/80 bg-panel/85 p-5 backdrop-blur-xl sm:p-6">
            {/* Top accent */}
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent" />

            {/* Card heading */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-ink">
                  Secure Access
                </p>

                <h2 className="mt-2 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-flag">
                  {mode === "signin"
                    ? `${role} sign-in`
                    : `Create ${role} account`}
                </h2>
              </div>

              <span className="flex items-center gap-2 font-mono text-[10px] text-muted-ink">
                <span className="size-2 rounded-full bg-low lamp-slow" />
                SECURE
              </span>
            </div>

            {/* Role switch */}
            <div className="relative mb-6 grid grid-cols-2 rounded-xl border border-line bg-ink/80 p-1">
              <span
                className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-accent-gold transition-transform duration-300 ease-duty"
                style={{
                  transform: `translateX(${idx * 100}%)`,
                }}
              />

              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setRole(r.id);
                    setError(null);
                  }}
                  className={`relative z-10 rounded-lg px-3 py-2.5 text-center transition-colors duration-300 ${
                    role === r.id
                      ? "text-ink"
                      : "text-muted-ink hover:text-paper"
                  }`}
                >
                  <span className="block font-mono text-[11px] font-semibold uppercase tracking-wider">
                    {r.label}
                  </span>

                  <span className="mt-0.5 block text-[10px] opacity-80">
                    {r.hint}
                  </span>
                </button>
              ))}
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                submit.mutate();
              }}
              className="space-y-4"
            >
              {/* Service ID */}
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-ink">
                  Service ID
                </label>
              
                <div className="relative">
                  <input
                    value={serviceId}
                    onChange={(e) =>
                      setServiceId(e.target.value)
                    }
                    placeholder={
                      role === "commander"
                        ? "CMD-0007"
                        : "PC-2041-88"
                    }
                    autoComplete="username"
                    required
                    type="text"
                    className="w-full rounded-lg border border-line bg-ink/80 px-3 py-3 pr-12 font-mono text-sm text-paper outline-none transition-all placeholder:text-muted-ink focus:border-accent-gold/60 focus:ring-2 focus:ring-accent-gold/10"
                    style={
                      !showServiceId && serviceId
                        ? {
                            WebkitTextSecurity: "none",
                          }
                        : undefined
                    }
                  />
              
                  {!showServiceId && serviceId && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-3 right-12 flex items-center bg-ink/80 font-mono text-sm tracking-[0.16em] text-paper"
                    >
                      {"#".repeat(serviceId.length)}
                    </div>
                  )}
              
                  <button
                    type="button"
                    aria-label={
                      showServiceId
                        ? "Hide service ID"
                        : "Show service ID"
                    }
                    onClick={() =>
                      setShowServiceId(
                        (visible) => !visible,
                      )
                    }
                    className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-ink transition-colors hover:bg-paper/5 hover:text-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/30"
                  >
                    {showServiceId ? (
                      /* Eye */
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="size-[18px]"
                      >
                        <path
                          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="2.7"
                        />
                      </svg>
                    ) : (
                      /* Eye with slash */
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="size-[18px]"
                      >
                        <path
                          d="M3 3l18 18"
                        />
                        <path
                          d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17.4 17.4 0 0 1-3.2 3.7"
                        />
                        <path
                          d="M6.1 6.9C3.7 8.5 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.2-.6"
                        />
                        <path
                          d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-ink">
                  Password
                </label>
              
                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    autoComplete={
                      mode === "create"
                        ? "new-password"
                        : "current-password"
                    }
                    required
                    minLength={6}
                    placeholder={
                      showPassword
                        ? ""
                        : "********"
                    }
                    className="w-full rounded-lg border border-line bg-ink/80 px-3 py-3 pr-12 font-mono text-sm text-paper outline-none transition-all placeholder:text-muted-ink focus:border-accent-gold/60 focus:ring-2 focus:ring-accent-gold/10"
                  />
              
                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShowPassword(
                        (visible) => !visible,
                      )
                    }
                    className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-ink transition-colors hover:bg-paper/5 hover:text-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/30"
                  >
                    {showPassword ? (
                      /* Eye */
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="size-[18px]"
                      >
                        <path
                          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="2.7"
                        />
                      </svg>
                    ) : (
                      /* Eye with slash */
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="size-[18px]"
                      >
                        <path d="M3 3l18 18" />
              
                        <path
                          d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17.4 17.4 0 0 1-3.2 3.7"
                        />
              
                        <path
                          d="M6.1 6.9C3.7 8.5 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.2-.6"
                        />
              
                        <path
                          d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              {mode === "create" && (
                <div className="rise">
                  <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted-ink">
                    Confirm password
                  </label>

                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-line bg-ink/80 px-3 py-3 font-mono text-sm text-paper outline-none transition-all placeholder:text-muted-ink focus:border-accent-gold/60 focus:ring-2 focus:ring-accent-gold/10"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="rounded-lg border border-red-alert/40 bg-red-alert/10 px-3 py-2.5 font-mono text-[11px] text-red-alert">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submit.isPending}
                className="press-scale w-full rounded-lg bg-accent-gold py-3 text-sm font-semibold text-ink transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submit.isPending
                  ? "Verifying…"
                  : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            {/* Toggle account mode */}
            <button
              type="button"
              onClick={() => {
                setMode(
                  mode === "signin"
                    ? "create"
                    : "signin",
                );

                setError(null);
              }}
              className="mt-5 w-full text-center font-mono text-[11px] uppercase tracking-wider text-muted-ink transition-colors hover:text-accent-gold"
            >
              {mode === "signin"
                ? "No account? Create one"
                : "Have an account? Sign in"}
            </button>
          </div>

          {/* Demo credentials */}
          <p className="mt-4 text-center font-mono text-[10px] leading-relaxed text-muted-ink">
            Demo · personnel PC-2041-88 / raksha123
            <br className="sm:hidden" />
            {" · "}
            commander CMD-0007 / command123
          </p>
        </section>
      </div>

      {/* =========================================================
          FOOTER
          ========================================================= */}

      <footer className="relative z-20 px-4 pb-6 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-muted-ink/70">
        For police personnel only · Fully confidential
      </footer>
    </main>
  );
}