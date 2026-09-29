import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { officialClubs, type ClubPlan, type OfficialClub } from "@/lib/clubPlans";
import { activePlanIds, savePlan } from "@/server/proRecords";

const FILE = resolve("discotecas.json");
const overrides = new Map<string, boolean>();

function applyOverride(club: OfficialClub): OfficialClub {
  const active = overrides.get(club.id);
  if (active === undefined) return club;
  const plan: ClubPlan = active ? "pro" : "free";
  return { ...club, suscripcionActiva: active, plan };
}

function bundledClubs(): OfficialClub[] {
  return officialClubs.map((club) => applyOverride({ ...club }));
}

function readRawRows(): unknown[] {
  try {
    const rows: unknown = JSON.parse(readFileSync(FILE, "utf8"));
    return Array.isArray(rows) ? rows : officialClubs.map((club) => ({ ...club }));
  } catch {
    return officialClubs.map((club) => ({ ...club }));
  }
}

export function readOfficialClubs(): OfficialClub[] {
  const clubs = readRawRows().filter(isOfficialClub).map(applyOverride);
  return clubs.length > 0 ? clubs : bundledClubs();
}

export function activeClubIds(): string[] {
  return readOfficialClubs()
    .filter((club) => club.suscripcionActiva || club.plan === "pro")
    .map((club) => club.id);
}

export async function setClubPlan(id: string, active: boolean): Promise<OfficialClub | null> {
  const known = officialClubs.find((club) => club.id === id) ?? null;
  const rows = readRawRows();
  const index = rows.findIndex((row) => isOfficialClub(row) && row.id === id);
  if (!known && index < 0) return null;

  overrides.set(id, active);
  const plan: ClubPlan = active ? "pro" : "free";
  const current = index >= 0 ? rows[index] : null;
  if (isOfficialClub(current)) {
    current.suscripcionActiva = active;
    current.plan = plan;
    try {
      writeFileSync(FILE, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
    } catch {
      // En Vercel el disco no conserva el archivo. El estado queda en la base de datos.
    }
    if (!(await savePlan(id, active))) return null;
    return { ...current, suscripcionActiva: active, plan };
  }

  if (!known) return null;
  if (!(await savePlan(id, active))) return null;
  return { ...known, suscripcionActiva: active, plan };
}

export async function allActiveClubIds(): Promise<string[]> {
  const ids = new Set(activeClubIds());
  for (const id of await activePlanIds()) ids.add(id);
  return [...ids];
}

function isOfficialClub(row: unknown): row is OfficialClub {
  if (!row || typeof row !== "object") return false;
  const club = row as { id?: unknown; plan?: unknown };
  return typeof club.id === "string" && (club.plan === "free" || club.plan === "pro" || club.plan == null);
}

export function planOf(active: boolean): ClubPlan {
  return active ? "pro" : "free";
}
