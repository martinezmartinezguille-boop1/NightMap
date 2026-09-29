import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { officialClubById, officialClubs, type OfficialClub } from "@/lib/clubPlans";
import { isManagerRole } from "@/lib/managerRole";
import { listManagers as listStoredManagers, saveManager } from "@/server/proRecords";
import type { SessionUser } from "@/server/sessionUser";

export interface VenueManager {
  email: string;
  discotecaId: string;
  role: string;
}

const FILE = resolve("gerentes.json");
const memory = new Map<string, VenueManager>();

function isManager(row: unknown): row is VenueManager {
  if (!row || typeof row !== "object") return false;
  const value = row as { email?: unknown; discotecaId?: unknown; role?: unknown };
  return typeof value.email === "string" && typeof value.discotecaId === "string" && typeof value.role === "string";
}

function readFileManagers(): VenueManager[] {
  try {
    const rows: unknown = JSON.parse(readFileSync(FILE, "utf8"));
    if (!Array.isArray(rows)) return [];
    return rows.filter(isManager).map((row) => ({
      email: row.email.trim().toLowerCase(),
      discotecaId: row.discotecaId,
      role: row.role,
    }));
  } catch {
    return [];
  }
}

export function listManagers(): VenueManager[] {
  const byEmail = new Map<string, VenueManager>();
  for (const row of readFileManagers()) byEmail.set(row.email, row);
  for (const [email, row] of memory) byEmail.set(email, row);
  return [...byEmail.values()];
}

export async function assignManager(entry: VenueManager): Promise<VenueManager | null> {
  const next: VenueManager = {
    email: entry.email.trim().toLowerCase(),
    discotecaId: entry.discotecaId,
    role: entry.role.trim(),
  };
  const stored = await saveManager(next);
  if (!stored) return null;
  memory.set(next.email, next);
  const rows = listManagers().filter((row) => row.email !== next.email);
  rows.push(next);
  try {
    writeFileSync(FILE, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  } catch {
    // La copia en disco es local. La vinculación que cuenta está firmada en la base de datos.
  }
  return next;
}

export async function stampManagerOnAccount(entry: VenueManager): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let page = 1;
    while (page <= 5) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data?.users.length) return;
      const user = data.users.find((item) => item.email?.trim().toLowerCase() === entry.email);
      if (user) {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          app_metadata: { ...user.app_metadata, role: "gerente", discotecaId: entry.discotecaId },
        });
        return;
      }
      if (data.users.length < 200) return;
      page += 1;
    }
  } catch {
    // Sin service role, la vinculación queda en gerentes.json.
  }
}

export async function resolveManagedClub(user: SessionUser): Promise<OfficialClub | null> {
  const stored = (await listStoredManagers()).find((row) => row.email === user.email && isManagerRole(row.role));
  if (stored) {
    const fromDatabase = officialClubById(stored.discotecaId);
    if (fromDatabase) return fromDatabase;
  }

  const metaRole = typeof user.appMetadata["role"] === "string" ? user.appMetadata["role"] : "";
  const metaId = typeof user.appMetadata["discotecaId"] === "string" ? user.appMetadata["discotecaId"] : "";
  if (metaId && isManagerRole(metaRole)) {
    const fromSession = officialClubById(metaId);
    if (fromSession) return fromSession;
  }

  const local = listManagers().find((row) => row.email === user.email && isManagerRole(row.role));
  if (local) {
    const fromFile = officialClubById(local.discotecaId);
    if (fromFile) return fromFile;
  }

  return officialClubs.find((club) => club.gerenteEmail?.trim().toLowerCase() === user.email) ?? null;
}
