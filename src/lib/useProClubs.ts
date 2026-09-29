import { useEffect, useState } from "react";
import { PRO_STORAGE_KEY, isProClub, proPlaceIds, type OfficialClub } from "@/lib/clubPlans";
import type { Place } from "../../types/place";

function readStoredIds(): Set<string> {
  try {
    const raw = localStorage.getItem(PRO_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function rememberProClub(id: string) {
  const next = readStoredIds();
  next.add(id);
  localStorage.setItem(PRO_STORAGE_KEY, JSON.stringify([...next]));
  window.dispatchEvent(new Event("nightmap-pro"));
}

export function useProClubs() {
  const [extraIds, setExtraIds] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    const sync = () => setExtraIds(readStoredIds());
    sync();
    window.addEventListener("nightmap-pro", sync);
    window.addEventListener("storage", sync);

    fetch("/api/suscripcion/estado")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: unknown) => {
        if (!body || typeof body !== "object" || !("activas" in body) || !Array.isArray(body.activas)) return;
        const active = readStoredIds();
        for (const id of body.activas) {
          if (typeof id === "string") active.add(id);
        }
        localStorage.setItem(PRO_STORAGE_KEY, JSON.stringify([...active]));
        setExtraIds(active);
      })
      .catch(() => undefined);

    return () => {
      window.removeEventListener("nightmap-pro", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    extraIds,
    isPro: (place: Place) => isProClub(place, extraIds),
    placeIds: (places: readonly Place[]) => proPlaceIds(places, extraIds),
  };
}

export type { OfficialClub };
