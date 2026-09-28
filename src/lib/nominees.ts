import type { Place } from "../../types/place";

export type Community =
  | "Catalunya"
  | "Illes Balears"
  | "Andalucía"
  | "Comunidad de Madrid"
  | "Comunidad Valenciana"
  | "Islas Canarias"
  | "País Vasco"
  | "Galicia"
  | "Región de Murcia";

type Box = readonly [latMin: number, latMax: number, lngMin: number, lngMax: number];

interface Nominee {
  id: string;
  community: Community;
  aliases: readonly string[];
  box: Box;
  reject?: readonly string[];
}

const CATALUNYA: Box = [40.5, 42.95, 0.05, 3.4];
const BALEARS: Box = [38.6, 40.15, 1.1, 4.45];
const ANDALUCIA: Box = [35.9, 38.8, -7.6, -1.5];
const MADRID: Box = [39.85, 41.2, -4.6, -3.05];
const VALENCIA: Box = [37.8, 40.8, -1.55, 0.7];
const CANARIAS: Box = [27.4, 29.5, -18.3, -13.2];
const EUSKADI: Box = [42.45, 43.5, -3.5, -1.7];
const GALICIA: Box = [41.8, 43.85, -9.35, -6.7];
const MURCIA: Box = [37.35, 38.85, -2.4, -0.65];
const MALAGA: Box = [36.6, 36.85, -4.7, -4.2];
const ROQUETAS: Box = [36.75, 36.95, -2.6, -2.3];
const SEVILLA: Box = [37.3, 37.5, -6.1, -5.8];
const MARBELLA: Box = [36.45, 36.6, -5.05, -4.8];
const BENIDORM: Box = [38.5, 38.6, -0.2, -0.02];
const IBIZA: Box = [38.8, 39.15, 1.2, 1.65];
const BARCELONA: Box = [41.32, 41.47, 2.05, 2.28];
const BARBERA: Box = [41.48, 41.55, 2.1, 2.2];
const GURB: Box = [41.9, 42.0, 2.2, 2.32];
const LLORET: Box = [41.67, 41.74, 2.8, 2.9];
const PLATJA_ARO: Box = [41.78, 41.85, 2.98, 3.12];
const PALMA_BEACH: Box = [39.45, 39.65, 2.6, 2.85];
const VALENCIA_CITY: Box = [39.4, 39.55, -0.45, -0.28];
const DENIA: Box = [38.8, 38.9, 0.02, 0.2];
const ADEJE: Box = [28.02, 28.15, -16.82, -16.65];
const ALICANTE: Box = [38.3, 38.4, -0.55, -0.42];

/** Nominados, agrupados por comunidad. El recuadro evita marcar un local homónimo de otra región. */
export const NOMINEES: readonly Nominee[] = [
  { id: "bling-bling", community: "Catalunya", aliases: ["bling bling"], box: CATALUNYA },
  { id: "enfants", community: "Catalunya", aliases: ["les enfants brillants"], box: CATALUNYA },
  { id: "luz-de-gas", community: "Catalunya", aliases: ["luz de gas"], box: CATALUNYA },
  { id: "razzmatazz", community: "Catalunya", aliases: ["razzmatazz"], box: CATALUNYA, reject: ["sales"] },
  { id: "sala-apolo", community: "Catalunya", aliases: ["sala apolo"], box: CATALUNYA },
  { id: "sutton", community: "Catalunya", aliases: ["sutton club"], box: CATALUNYA },
  { id: "titus", community: "Catalunya", aliases: ["titus carpa"], box: CATALUNYA },
  { id: "phoenix", community: "Catalunya", aliases: ["disco phoenix"], box: CATALUNYA },
  { id: "cocoa", community: "Catalunya", aliases: ["cocoa mataro"], box: CATALUNYA },
  { id: "passarella", community: "Catalunya", aliases: ["empuriabrava"], box: CATALUNYA },
  { id: "biloba", community: "Catalunya", aliases: ["biloba"], box: CATALUNYA },
  { id: "revolution", community: "Catalunya", aliases: ["disco revolution"], box: CATALUNYA },
  { id: "st-trop", community: "Catalunya", aliases: ["st trop"], box: CATALUNYA },
  { id: "tropical-salou", community: "Catalunya", aliases: ["tropical salou"], box: CATALUNYA },
  { id: "boris", community: "Catalunya", aliases: ["boris club"], box: BARCELONA },
  { id: "gatsby", community: "Catalunya", aliases: ["gatsby"], box: BARCELONA },
  { id: "input", community: "Catalunya", aliases: ["input high fidelity"], box: BARCELONA },
  { id: "carpe-diem", community: "Catalunya", aliases: ["carpe diem lounge"], box: BARCELONA },
  { id: "opium-barcelona", community: "Catalunya", aliases: ["opium barcelona"], box: BARCELONA },
  { id: "shoko-barcelona", community: "Catalunya", aliases: ["shoko barcelona"], box: BARCELONA },
  { id: "ku-barcelona", community: "Catalunya", aliases: ["ku barcelona"], box: BARCELONA },
  { id: "pikkara", community: "Catalunya", aliases: ["la pikkara"], box: BARBERA },
  { id: "el-cel", community: "Catalunya", aliases: ["el cel vic"], box: GURB },
  { id: "disco-prive", community: "Catalunya", aliases: ["disco prive"], box: LLORET, reject: ["privee", "privada"] },
  { id: "tropics", community: "Catalunya", aliases: ["disco tropics"], box: LLORET },
  { id: "beout", community: "Catalunya", aliases: ["beout"], box: PLATJA_ARO },
  { id: "papillon", community: "Catalunya", aliases: ["papillon platja"], box: PLATJA_ARO },

  { id: "unvrs", community: "Illes Balears", aliases: ["unvrs"], box: IBIZA },
  { id: "amnesia", community: "Illes Balears", aliases: ["amnesia"], box: IBIZA, reject: ["pab"] },
  { id: "blue-marlin", community: "Illes Balears", aliases: ["blue marlin"], box: IBIZA },
  { id: "chinois", community: "Illes Balears", aliases: ["chinois"], box: IBIZA },
  { id: "dc10", community: "Illes Balears", aliases: ["dc10", "dc 10"], box: IBIZA, reject: ["circoloco"] },
  { id: "eden", community: "Illes Balears", aliases: ["eden"], box: IBIZA },
  { id: "hi-ibiza", community: "Illes Balears", aliases: ["hi ibiza"], box: IBIZA },
  { id: "ibiza-rocks", community: "Illes Balears", aliases: ["ibiza rocks"], box: IBIZA },
  { id: "lio", community: "Illes Balears", aliases: ["lio ibiza"], box: IBIZA },
  { id: "pacha", community: "Illes Balears", aliases: ["pacha"], box: IBIZA },
  { id: "ushuaia", community: "Illes Balears", aliases: ["ushuaia"], box: IBIZA },
  { id: "bcm", community: "Illes Balears", aliases: ["bcm"], box: BALEARS },
  { id: "cafe-mambo", community: "Illes Balears", aliases: ["cafe mambo ibiza"], box: IBIZA },
  { id: "destino", community: "Illes Balears", aliases: ["destino ibiza"], box: IBIZA },
  { id: "nassau", community: "Illes Balears", aliases: ["nassau beach"], box: IBIZA },
  { id: "o-beach", community: "Illes Balears", aliases: ["o beach"], box: IBIZA },
  { id: "playa-soleil", community: "Illes Balears", aliases: ["playa soleil"], box: IBIZA },
  { id: "amok", community: "Illes Balears", aliases: ["amok"], box: PALMA_BEACH },

  { id: "marau", community: "Andalucía", aliases: ["marau"], box: ANDALUCIA },
  { id: "mae-west", community: "Andalucía", aliases: ["mae west"], box: ROQUETAS, reject: ["granada"] },
  { id: "sala-gold", community: "Andalucía", aliases: ["sala gold"], box: MALAGA },
  { id: "antique", community: "Andalucía", aliases: ["discoteca antique"], box: SEVILLA },
  { id: "momento", community: "Andalucía", aliases: ["momento marbella"], box: MARBELLA },
  { id: "motel", community: "Andalucía", aliases: ["motel particulier", "motel members"], box: MARBELLA },
  { id: "nao", community: "Andalucía", aliases: ["nao pool"], box: MARBELLA },
  { id: "nikki", community: "Andalucía", aliases: ["nikki beach"], box: ANDALUCIA },
  { id: "ocean", community: "Andalucía", aliases: ["ocean club marbella"], box: MARBELLA, reject: ["big bang"] },
  { id: "elysium", community: "Andalucía", aliases: ["elysium sevilla"], box: SEVILLA },
  { id: "fitz-marbella", community: "Andalucía", aliases: ["fitz marbella"], box: MARBELLA },
  { id: "mamzel", community: "Andalucía", aliases: ["mamzel"], box: MARBELLA },
  { id: "playa-padre", community: "Andalucía", aliases: ["playa padre"], box: MARBELLA },
  { id: "xcess", community: "Andalucía", aliases: ["xcess"], box: MARBELLA },
  { id: "opium-marbella", community: "Andalucía", aliases: ["opium beach", "opium marbella"], box: MARBELLA },

  { id: "fabrik", community: "Comunidad de Madrid", aliases: ["fabrik madrid"], box: MADRID },
  { id: "fitz", community: "Comunidad de Madrid", aliases: ["fitz club"], box: MADRID },
  { id: "jowke", community: "Comunidad de Madrid", aliases: ["jowke"], box: MADRID },
  { id: "lab", community: "Comunidad de Madrid", aliases: ["lab theclub"], box: MADRID },
  { id: "lula", community: "Comunidad de Madrid", aliases: ["lula club"], box: MADRID },
  { id: "opium-madrid", community: "Comunidad de Madrid", aliases: ["opium madrid"], box: MADRID },
  { id: "shoko-madrid", community: "Comunidad de Madrid", aliases: ["shoko"], box: MADRID, reject: ["cafe", "bar"] },
  { id: "kapital", community: "Comunidad de Madrid", aliases: ["teatro kapital"], box: MADRID },
  { id: "bassement", community: "Comunidad de Madrid", aliases: ["bassement"], box: MADRID },
  { id: "vandido", community: "Comunidad de Madrid", aliases: ["vandido club"], box: MADRID },
  { id: "florida-retiro", community: "Comunidad de Madrid", aliases: ["florida retiro"], box: MADRID },

  { id: "ku-benidorm", community: "Comunidad Valenciana", aliases: ["ku"], box: BENIDORM },
  { id: "velice", community: "Comunidad Valenciana", aliases: ["velice"], box: VALENCIA },
  { id: "mya", community: "Comunidad Valenciana", aliases: ["mya"], box: VALENCIA },
  { id: "spook", community: "Comunidad Valenciana", aliases: ["spook"], box: VALENCIA, reject: ["new spook"] },
  { id: "insomnia", community: "Comunidad Valenciana", aliases: ["insomnia benidorm"], box: BENIDORM },
  { id: "alegal", community: "Comunidad Valenciana", aliases: ["alegal"], box: VALENCIA_CITY },
  { id: "marina-beach", community: "Comunidad Valenciana", aliases: ["marina beach club"], box: VALENCIA_CITY },
  { id: "condado", community: "Comunidad Valenciana", aliases: ["condado club"], box: DENIA },
  { id: "marmarela", community: "Comunidad Valenciana", aliases: ["marmarela"], box: ALICANTE },

  { id: "monkey", community: "Islas Canarias", aliases: ["monkey beach"], box: CANARIAS },
  { id: "papagayo", community: "Islas Canarias", aliases: ["papagayo beach"], box: CANARIAS },
  { id: "le-club", community: "Islas Canarias", aliases: ["le club"], box: ADEJE, reject: ["attica", "club 33"] },
  { id: "magic", community: "Islas Canarias", aliases: ["magic lounge"], box: ADEJE },

  { id: "sonora", community: "País Vasco", aliases: ["sonora"], box: EUSKADI, reject: ["sport", "tavern"] },
  { id: "bataplan", community: "País Vasco", aliases: ["bataplan"], box: EUSKADI },

  { id: "pelicano", community: "Galicia", aliases: ["sala pelicano", "pelicano"], box: GALICIA, reject: ["bar pelicano"] },

  { id: "odiseo", community: "Región de Murcia", aliases: ["odiseo"], box: MURCIA },
];

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasPhrase(title: string, alias: string): boolean {
  const name = normalizeName(title);
  const needle = normalizeName(alias);
  if (!name || !needle) return false;
  if (name === needle) return true;
  return ` ${name} `.includes(` ${needle} `);
}

function inBox(place: Place, box: Box): boolean {
  const { lat, lng } = place.location;
  return lat >= box[0] && lat <= box[1] && lng >= box[2] && lng <= box[3];
}

function sourceScore(place: Place): number {
  if (place.placeId.startsWith("osm:")) return 0;
  if (place.placeId.startsWith("featured:")) return 1;
  return 2;
}

function matchesNominee(place: Place, nominee: Nominee): boolean {
  if (!inBox(place, nominee.box)) return false;
  const name = normalizeName(place.title);
  if (nominee.reject?.some((word) => hasPhrase(name, word))) return false;
  if (nominee.id === "eden" || nominee.id === "ku-benidorm" || nominee.id === "shoko-madrid") {
    return nominee.aliases.some((alias) => name === normalizeName(alias));
  }
  return nominee.aliases.some((alias) => hasPhrase(place.title, alias));
}

function matchScore(place: Place, nominee: Nominee): number {
  const name = normalizeName(place.title);
  const exact = nominee.aliases.some((alias) => name === normalizeName(alias));
  return sourceScore(place) * 10 + (exact ? 5 : 0);
}

function bestNomineeMatch(places: readonly Place[], nominee: Nominee): Place | null {
  let best: Place | null = null;
  let bestScore = -1;
  for (const place of places) {
    if (!matchesNominee(place, nominee)) continue;
    const score = matchScore(place, nominee);
    if (
      score > bestScore ||
      (score === bestScore && best != null && place.title.length < best.title.length)
    ) {
      best = place;
      bestScore = score;
    }
  }
  return best;
}

export function nominatedPlaceIds(places: readonly Place[]): Set<string> {
  const ids = new Set<string>();
  for (const nominee of NOMINEES) {
    const match = bestNomineeMatch(places, nominee);
    if (match) ids.add(match.placeId);
  }
  return ids;
}

export function nomineeCommunity(place: Place): Community | null {
  for (const nominee of NOMINEES) {
    if (matchesNominee(place, nominee)) return nominee.community;
  }
  return null;
}

export function isNominatedPlace(place: Place): boolean {
  return nomineeCommunity(place) != null;
}
