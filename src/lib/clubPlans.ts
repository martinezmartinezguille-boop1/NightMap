import catalog from "../../discotecas.json";
import type { Place } from "../../types/place";

export type ClubPlan = "free" | "pro";

export interface OfficialClub {
  id: string;
  nombre: string;
  ciudad: string;
  grupo: string;
  tipo: string;
  email: string;
  web: string;
  contactoEnviado: boolean;
  suscripcionActiva: boolean;
  plan: ClubPlan;
}

type Box = readonly [latMin: number, latMax: number, lngMin: number, lngMax: number];

interface MatchRule {
  id: string;
  box: Box;
  aliases: readonly string[];
  reject?: readonly string[];
}

const MADRID: Box = [40.15, 40.6, -4.05, -3.5];
const BARCELONA: Box = [41.32, 41.48, 2.05, 2.28];
const IBIZA: Box = [38.75, 39.12, 1.18, 1.62];
const VALENCIA: Box = [39.4, 39.55, -0.45, -0.28];

const RULES: readonly MatchRule[] = [
  { id: "fitz-club-madrid", box: MADRID, aliases: ["fitz club"] },
  { id: "shoko-madrid", box: MADRID, aliases: ["shoko"] },
  { id: "teatro-kapital", box: MADRID, aliases: ["teatro kapital", "kapital"] },
  { id: "fabrik-madrid", box: MADRID, aliases: ["fabrik"] },
  { id: "vandidoclub", box: MADRID, aliases: ["vandido"] },
  { id: "copernico-the-club", box: MADRID, aliases: ["copernico"] },
  { id: "lula-club", box: MADRID, aliases: ["lula club"] },
  { id: "mondo-disko", box: MADRID, aliases: ["mondo disko", "mondo"] },
  { id: "la-riviera", box: MADRID, aliases: ["la riviera"] },
  { id: "opium-barcelona", box: BARCELONA, aliases: ["opium barcelona"] },
  { id: "razzmatazz", box: BARCELONA, aliases: ["razzmatazz"] },
  { id: "sala-apolo", box: BARCELONA, aliases: ["sala apolo", "apolo"] },
  { id: "sutton-club", box: BARCELONA, aliases: ["sutton"] },
  { id: "input-barcelona", box: BARCELONA, aliases: ["input"] },
  { id: "luz-de-gas", box: BARCELONA, aliases: ["luz de gas"] },
  { id: "moog-barcelona", box: BARCELONA, aliases: ["moog"] },
  { id: "bikini-barcelona", box: BARCELONA, aliases: ["bikini"] },
  { id: "gatsby-barcelona", box: BARCELONA, aliases: ["gatsby"] },
  { id: "boris-club", box: BARCELONA, aliases: ["boris"] },
  { id: "ku-barcelona", box: BARCELONA, aliases: ["ku barcelona"] },
  { id: "amnesia-ibiza", box: IBIZA, aliases: ["amnesia"] },
  { id: "pacha-ibiza", box: IBIZA, aliases: ["pacha"], reject: ["pachanga", "mama"] },
  { id: "ushuaia-ibiza", box: IBIZA, aliases: ["ushuaia"] },
  { id: "unvrs-ibiza", box: IBIZA, aliases: ["unvrs"] },
  { id: "hi-ibiza", box: IBIZA, aliases: ["hi ibiza"] },
  { id: "lio-ibiza", box: IBIZA, aliases: ["lio ibiza", "lio"] },
  { id: "eden-ibiza", box: IBIZA, aliases: ["eden"], reject: ["huertas", "paradise", "liberal"] },
  { id: "blue-marlin-ibiza", box: IBIZA, aliases: ["blue marlin"] },
  { id: "dc10-ibiza", box: IBIZA, aliases: ["dc 10"] },
  { id: "cova-santa", box: IBIZA, aliases: ["cova santa"] },
  { id: "spook-club", box: VALENCIA, aliases: ["spook"] },
  { id: "alegal-valencia", box: VALENCIA, aliases: ["alegal"] },
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function inBox(place: Place, box: Box): boolean {
  const { lat, lng } = place.location;
  return lat >= box[0] && lat <= box[1] && lng >= box[2] && lng <= box[3];
}

function nameMatches(title: string, rule: MatchRule): boolean {
  const name = normalize(title);
  if (!name) return false;
  if (rule.reject?.some((part) => name.includes(part))) return false;
  return rule.aliases.some((alias) => name === alias || name.includes(alias));
}

export const officialClubs: readonly OfficialClub[] = catalog as OfficialClub[];

const clubsById = new Map(officialClubs.map((club) => [club.id, club]));

export function officialClubById(id: string): OfficialClub | null {
  return clubsById.get(id) ?? null;
}

export function matchOfficialClub(place: Place): OfficialClub | null {
  for (const rule of RULES) {
    if (!inBox(place, rule.box) || !nameMatches(place.title, rule)) continue;
    return clubsById.get(rule.id) ?? null;
  }
  return null;
}

export function isProClub(place: Place, extraIds: ReadonlySet<string>): boolean {
  const club = matchOfficialClub(place);
  if (!club) return false;
  return club.suscripcionActiva || club.plan === "pro" || extraIds.has(club.id);
}

export function proPlaceIds(places: readonly Place[], extraIds: ReadonlySet<string>): Set<string> {
  const ids = new Set<string>();
  for (const place of places) {
    if (isProClub(place, extraIds)) ids.add(place.placeId);
  }
  return ids;
}

export const PRO_PRICE_LABEL = "10 €/mes";
export const PRO_STORAGE_KEY = "nightmap-pro-clubs";
