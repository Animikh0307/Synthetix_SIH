import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Role } from "./auth.functions";

export type Session = { role: Role; serviceId: string };

const KEY = "rakshamitra.session";

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function writeSession(s: Session) {
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
}

export function homeFor(role: Role) {
  return role === "commander" ? "/commander" : "/check-in";
}

/** Reads the session after hydration and redirects to login if the role doesn't match. */
export function useRequireRole(role: Role) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = readSession();
    if (!s) {
      navigate({ to: "/", replace: true });
      return;
    }
    if (s.role !== role) {
      navigate({ to: homeFor(s.role), replace: true });
      return;
    }
    setSession(s);
    setReady(true);
  }, [navigate, role]);

  return { session, ready };
}

/** Mask a name: keep rank prefix hidden too, show only asterisks per letter. */
export function maskName(name: string) {
  return name.replace(/[^\s.]/g, "*");
}
