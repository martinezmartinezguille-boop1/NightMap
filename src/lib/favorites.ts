const STORAGE_KEY = "nightmap-favorites";

function readFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

function writeFavoriteIds(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("nightmap-favorites"));
}

export function listFavoriteIds(): string[] {
  return readFavoriteIds();
}

/** Devuelve true si el local queda marcado como favorito. */
export function toggleFavorite(placeId: string): boolean {
  const ids = readFavoriteIds();
  const active = ids.includes(placeId);
  writeFavoriteIds(active ? ids.filter((id) => id !== placeId) : [placeId, ...ids]);
  return !active;
}
