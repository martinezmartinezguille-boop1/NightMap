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

/** Avisos de ejemplo. El reloj del tablón los va renovando. */
export const BASE_ALERTS: readonly AlertTemplate[] = [
  {
    id: "tiffany-lost",
    title: "Tiffany's The Club",
    city: "Madrid",
    kind: "lost",
    message: "Chaqueta negra en el guardarropa. Pregunta en recepción con el ticket.",
    minutesAgo: 4,
  },
  {
    id: "lula-capacity",
    title: "Lula Club",
    city: "Madrid",
    kind: "capacity",
    message: "Aforo completo. La puerta no deja entrar hasta que salga gente.",
    minutesAgo: 2,
  },
  {
    id: "moog-schedule",
    title: "Moog Barcelona",
    city: "Barcelona",
    kind: "schedule",
    message: "La sesión de esta noche empieza a las 00:30, una hora más tarde.",
    minutesAgo: 18,
  },
  {
    id: "pacha-lost",
    title: "Pacha Sitges",
    city: "Sitges",
    kind: "lost",
    message: "Móvil negro encontrado en la pista. Está en barra principal.",
    minutesAgo: 11,
  },
  {
    id: "gold-capacity",
    title: "Sala Gold",
    city: "Málaga",
    kind: "capacity",
    message: "Lista de espera en puerta. El aforo está al límite.",
    minutesAgo: 7,
  },
  {
    id: "copera-schedule",
    title: "Industrial Copera",
    city: "Granada",
    kind: "schedule",
    message: "Cierre adelantado a las 5:00 por el cambio de horario de esta noche.",
    minutesAgo: 26,
  },
  {
    id: "cova-lost",
    title: "Cova Santa",
    city: "Ibiza",
    kind: "lost",
    message: "Bolso pequeño verde olvidado en la terraza. Recógelo en taquilla.",
    minutesAgo: 35,
  },
  {
    id: "row-capacity",
    title: "Row 14",
    city: "Viladecans",
    kind: "capacity",
    message: "Aforo completo en sala. Solo se accede con pulsera de la lista.",
    minutesAgo: 9,
  },
  {
    id: "papagayo-schedule",
    title: "Papagayo Beach Club",
    city: "Adeje",
    kind: "schedule",
    message: "La sesión de tarde pasa a las 18:00. La de noche se mantiene.",
    minutesAgo: 48,
  },
  {
    id: "bcm-capacity",
    title: "BCM",
    city: "Calvià",
    kind: "capacity",
    message: "Aforo completo en la pista principal. Queda sitio solo en la terraza.",
    minutesAgo: 14,
  },
];

export const LIVE_ALERTS: readonly AlertTemplate[] = [
  {
    id: "ohmy-lost",
    title: "Oh My Club",
    city: "Madrid",
    kind: "lost",
    message: "Llaves con llavero rojo encontradas en el reservado 2.",
    minutesAgo: 0,
  },
  {
    id: "independance-capacity",
    title: "Independance Club",
    city: "Madrid",
    kind: "capacity",
    message: "Aforo completo. Abren un turno de entrada en 15 minutos.",
    minutesAgo: 0,
  },
  {
    id: "octan-schedule",
    title: "Octan Ibiza",
    city: "Ibiza",
    kind: "schedule",
    message: "El cierre de esta noche se alarga hasta las 6:30.",
    minutesAgo: 0,
  },
  {
    id: "nikki-capacity",
    title: "Nikki Beach",
    city: "Marbella",
    kind: "capacity",
    message: "La terraza está completa. La lista de espera es en puerta norte.",
    minutesAgo: 0,
  },
];

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
