import type { Place } from "../../types/place";

export type AlertKind = "lost" | "capacity" | "schedule";

export interface AlertTemplate {
  id: string;
  title: string;
  city: string;
  kind: AlertKind;
  message: string;
  minutesAgo: number;
}

export interface VenueAlert {
  id: string;
  place: Place;
  kind: AlertKind;
  message: string;
  postedAt: number;
}

export const BASE_ALERTS: readonly AlertTemplate[] = [];

const KIND_LABEL: Record<AlertKind, string> = {
  lost: "Objeto perdido",
  capacity: "Aforo completo",
  schedule: "Cambio de horario",
};

export function alertKindLabel(kind: AlertKind): string {
  return KIND_LABEL[kind];
}

export function formatAlertAge(postedAt: number, now: number): string {
  const minutes = Math.max(0, Math.round((now - postedAt) / 60000));
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "hace 1 h" : `hace ${hours} h`;
}

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pickPlace(places: readonly Place[], template: AlertTemplate): Place | undefined {
  const want = normalizeName(template.title);
  const wantCity = normalizeName(template.city);
  if (!want) return undefined;

  let best: Place | undefined;
  let bestScore = -1;

  for (const place of places) {
    const title = normalizeName(place.title);
    const city = normalizeName(place.city ?? "");
    if (!title.includes(want) && !want.includes(title)) continue;

    const cityHit = !wantCity || !city || city.includes(wantCity) || wantCity.includes(city);
    if (!cityHit && title !== want) continue;

    let score = title === want ? 10 : 4;
    if (cityHit) score += 3;
    if (!place.placeId.startsWith("osm:")) score += 2;
    if (score > bestScore) {
      best = place;
      bestScore = score;
    }
  }

  return best;
}

export function resolveAlerts(
  places: readonly Place[],
  templates: readonly AlertTemplate[],
  now: number,
): VenueAlert[] {
  const alerts: VenueAlert[] = [];
  for (const template of templates) {
    const place = pickPlace(places, template);
    if (!place) continue;
    alerts.push({
      id: template.id,
      place,
      kind: template.kind,
      message: template.message,
      postedAt: now - template.minutesAgo * 60_000,
    });
  }
  return alerts.sort((a, b) => b.postedAt - a.postedAt);
}
