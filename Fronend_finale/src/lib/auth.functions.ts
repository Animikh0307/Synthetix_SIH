import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { HR_RECORDS } from "./personnel-data";

export type Role = "commander" | "personnel";

type Account = { role: Role; serviceId: string; passwordHash: string };

// Demo account store (in-memory). Replace with Lovable Cloud auth for persistence.
const accounts = new Map<string, Account>();

async function hash(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const key = (role: Role, serviceId: string) => `${role}:${serviceId.trim().toUpperCase()}`;

let seeded = false;
async function ensureSeed() {
  if (seeded) return;
  seeded = true;
  for (const r of HR_RECORDS) {
    accounts.set(key("personnel", r.serviceId), {
      role: "personnel",
      serviceId: r.serviceId,
      passwordHash: await hash("raksha123"),
    });
  }
  accounts.set(key("commander", "CMD-0007"), {
    role: "commander",
    serviceId: "CMD-0007",
    passwordHash: await hash("command123"),
  });
}

const credentials = z.object({
  role: z.enum(["commander", "personnel"]),
  serviceId: z.string().trim().min(3).max(24),
  password: z.string().min(6).max(128),
});

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentials.parse(data))
  .handler(async ({ data }) => {
    await ensureSeed();
    const acc = accounts.get(key(data.role, data.serviceId));
    if (!acc || acc.passwordHash !== (await hash(data.password))) {
      return { ok: false as const, error: "Invalid service ID or password." };
    }
    return { ok: true as const, session: { role: acc.role, serviceId: acc.serviceId } };
  });

export const createAccount = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentials.parse(data))
  .handler(async ({ data }) => {
    await ensureSeed();
    const id = data.serviceId.trim().toUpperCase();
    if (data.role === "personnel" && !HR_RECORDS.some((r) => r.serviceId === id)) {
      return { ok: false as const, error: "No HR record exists for that service ID." };
    }
    if (accounts.has(key(data.role, id))) {
      return { ok: false as const, error: "An account already exists for that service ID." };
    }
    accounts.set(key(data.role, id), {
      role: data.role,
      serviceId: id,
      passwordHash: await hash(data.password),
    });
    return { ok: true as const, session: { role: data.role, serviceId: id } };
  });
