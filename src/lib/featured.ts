import type { Place } from "../../types/place";
import { featuredIds2026 } from "./featuredClubs2026";

/** Discotecas clave. Si hay dos fichas del mismo local, se queda la de Google Places. */
const FEATURED_CLUBS = ["fitz", "copernico", "vandido", "nuit", "tiffany", "b12", "riviera"] as const;

export type FeaturedClubId = (typeof FEATURED_CLUBS)[number];

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function inMadrid(place: Place): boolean {
  if (place.city && normalizeName(place.city) === "madrid") return true;
  const { lat, lng } = place.location;
  return lat >= 40.31 && lat <= 40.55 && lng >= -3.85 && lng <= -3.55;
}

/** Devuelve la discoteca clave, o null si el local no está en el listado. */
export function featuredClubId(place: Place): FeaturedClubId | null {
  const name = normalizeName(place.title);
  if (!name || !inMadrid(place)) return null;

  if (name === "fitz club" || name === "fitz") return "fitz";
  if (name === "copernico" || name === "copernico the club" || name === "sala copernico") return "copernico";
  if (name === "vandido" || name === "vandido club" || name === "discoteca vandido") return "vandido";
  if (name === "nuit" || name === "discoteca nuit") return "nuit";
  if (name.includes("tiffany")) return "tiffany";
  if (/\bb12\b/.test(name)) return "b12";
  if (name === "la riviera") return "riviera";
  return null;
}

function sourceScore(place: Place): number {
  return place.placeId.startsWith("osm:") ? 0 : 1;
}

/** Un solo `placeId` por discoteca clave. Gana Google Places si también está en OpenStreetMap. */
export function featuredPlaceIds(places: readonly Place[]): Set<string> {
  const best = new Map<FeaturedClubId, Place>();
  for (const place of places) {
    const id = featuredClubId(place);
    if (!id) continue;
    const current = best.get(id);
    if (!current || sourceScore(place) > sourceScore(current)) best.set(id, place);
  }
  const ids = new Set([...best.values()].map((place) => place.placeId));
  for (const id of featuredIds2026(places)) ids.add(id);
  return ids;
}
