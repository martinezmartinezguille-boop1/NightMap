export interface CheckIn {
  id: string;
  placeId: string;
  clubTitle: string;
  city: string;
  at: string;
}

const STORAGE_KEY = "nightmap-checkins";

function readCheckIns(): CheckIn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCheckIn);
  } catch {
    return [];
  }
}

function isCheckIn(value: unknown): value is CheckIn {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row["id"] === "string" &&
    typeof row["placeId"] === "string" &&
    typeof row["clubTitle"] === "string" &&
    typeof row["city"] === "string" &&
    typeof row["at"] === "string"
  );
}

function writeCheckIns(checkIns: CheckIn[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checkIns));
  window.dispatchEvent(new Event("nightmap-checkins"));
}

function sameLocalDay(iso: string, now: Date): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function listCheckIns(): CheckIn[] {
  return readCheckIns().sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function checkedInToday(placeId: string, now = new Date()): boolean {
  return readCheckIns().some((entry) => entry.placeId === placeId && sameLocalDay(entry.at, now));
}

/** Suma un punto. Un mismo local solo cuenta una vez por día. */
export function addCheckIn(input: Omit<CheckIn, "id" | "at">): CheckIn | null {
  if (checkedInToday(input.placeId)) return null;
  const entry: CheckIn = {
    ...input,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
  };
  writeCheckIns([entry, ...readCheckIns()]);
  return entry;
}
