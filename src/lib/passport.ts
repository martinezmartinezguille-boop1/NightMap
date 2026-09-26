import type { CheckIn } from "@/lib/checkins";

export const RANKS = [
  { label: "Novato", min: 0 },
  { label: "Clubber", min: 3 },
  { label: "Veterano de Guerra", min: 8 },
  { label: "Leyenda Nocturna", min: 15 },
] as const;

export interface RankState {
  label: string;
  nextLabel: string | null;
  progress: number;
  current: number;
  floor: number;
  ceiling: number;
}

export type BadgeId = "first" | "explorer" | "madrid" | "coast" | "regular" | "nomad" | "owl" | "legend";

export interface BadgeState {
  id: BadgeId;
  title: string;
  hint: string;
  unlocked: boolean;
}

const COAST = [
  "barcelona",
  "sitges",
  "valencia",
  "malaga",
  "marbella",
  "ibiza",
  "eivissa",
  "palma",
  "mallorca",
  "adeje",
  "arona",
  "salou",
  "benidorm",
  "calvia",
  "lloret",
  "viladecans",
  "almeria",
  "santa eulalia",
  "sant antoni",
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function visitsCity(checkIns: readonly CheckIn[], needle: string): boolean {
  return checkIns.some((entry) => normalize(entry.city).includes(needle));
}

export function rankFor(count: number): RankState {
  let index = 0;
  for (let i = 0; i < RANKS.length; i += 1) {
    const rank = RANKS[i];
    if (rank && count >= rank.min) index = i;
  }
  const current = RANKS[index] ?? RANKS[0];
  const next = RANKS[index + 1];
  if (!current) {
    return { label: "Novato", nextLabel: "Clubber", progress: 0, current: count, floor: 0, ceiling: 3 };
  }
  if (!next) {
    return {
      label: current.label,
      nextLabel: null,
      progress: 1,
      current: count,
      floor: current.min,
      ceiling: current.min,
    };
  }
  const span = next.min - current.min;
  return {
    label: current.label,
    nextLabel: next.label,
    progress: span === 0 ? 1 : Math.min(1, Math.max(0, (count - current.min) / span)),
    current: count,
    floor: current.min,
    ceiling: next.min,
  };
}

export function badgesFor(checkIns: readonly CheckIn[]): BadgeState[] {
  const cities = new Set(checkIns.map((entry) => normalize(entry.city)).filter((city) => city.length > 0));
  const repeats = new Map<string, number>();
  for (const entry of checkIns) {
    repeats.set(entry.placeId, (repeats.get(entry.placeId) ?? 0) + 1);
  }
  const regular = [...repeats.values()].some((total) => total >= 3);
  const owl = checkIns.some((entry) => {
    const hour = new Date(entry.at).getHours();
    return hour >= 22 || hour < 6;
  });
  const coast = COAST.some((city) => visitsCity(checkIns, city));

  return [
    {
      id: "first",
      title: "Primer Check-in",
      hint: "Entra en tu primera sala",
      unlocked: checkIns.length >= 1,
    },
    {
      id: "explorer",
      title: "Rave Explorer",
      hint: "Acumula 5 check-ins",
      unlocked: checkIns.length >= 5,
    },
    {
      id: "madrid",
      title: "Madrid Night",
      hint: "Haz check-in en Madrid",
      unlocked: visitsCity(checkIns, "madrid"),
    },
    {
      id: "coast",
      title: "Costa Nocturna",
      hint: "Haz check-in en costa o islas",
      unlocked: coast,
    },
    {
      id: "regular",
      title: "Habitual",
      hint: "Vuelve 3 veces al mismo local",
      unlocked: regular,
    },
    {
      id: "nomad",
      title: "Nómada",
      hint: "Visita 3 ciudades distintas",
      unlocked: cities.size >= 3,
    },
    {
      id: "owl",
      title: "Búho",
      hint: "Check-in entre las 22:00 y las 06:00",
      unlocked: owl,
    },
    {
      id: "legend",
      title: "Leyenda",
      hint: "Alcanza 15 check-ins",
      unlocked: checkIns.length >= 15,
    },
  ];
}
