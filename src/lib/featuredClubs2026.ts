import type { Place } from "../../types/place";

interface FeaturedClubSeed {
  id: string;
  title: string;
  city: string;
  lat: number;
  lng: number;
  address?: string;
  aliases: readonly string[];
  maxMeters?: number;
}

/**
 * Salas 2026 con coordenada comprobada.
 * Si el local ya está en Google u OpenStreetMap, se reutiliza esa ficha.
 */
const CLUBS_2026: readonly FeaturedClubSeed[] = [
  {
    id: "lula",
    title: "Lula Club",
    city: "Madrid",
    lat: 40.4213789,
    lng: -3.707142,
    aliases: ["lula club"],
  },
  {
    id: "oh-my-club",
    title: "Oh My Club",
    city: "Madrid",
    lat: 40.4626472,
    lng: -3.6929723,
    address: "Calle de Rosario Pino 14, Madrid",
    aliases: ["oh my club"],
  },
  {
    id: "medias-puri",
    title: "Medias Puri",
    city: "Madrid",
    lat: 40.4123226,
    lng: -3.7034561,
    aliases: ["medias puri"],
  },
  {
    id: "unas-chung-lee",
    title: "Uñas Chung Lee",
    city: "Madrid",
    lat: 40.4361459,
    lng: -3.7162928,
    aliases: ["unas chung lee"],
  },
  {
    id: "tiffanys",
    title: "Tiffany's The Club",
    city: "Madrid",
    lat: 40.4455806,
    lng: -3.6833062,
    aliases: ["tiffany"],
  },
  {
    id: "istar",
    title: "Istar Club",
    city: "Madrid",
    lat: 40.428745,
    lng: -3.6875565,
    address: "Calle de Serrano 41, Madrid",
    aliases: ["istar"],
    maxMeters: 600,
  },
  {
    id: "gunilla",
    title: "Gunilla Club",
    city: "Madrid",
    lat: 40.4226066,
    lng: -3.6910073,
    address: "Paseo de Recoletos 16, Madrid",
    aliases: ["gunilla"],
    maxMeters: 600,
  },
  {
    id: "independance",
    title: "Independance Club",
    city: "Madrid",
    lat: 40.4096706,
    lng: -3.6929809,
    aliases: ["independance"],
  },
  {
    id: "thundercat",
    title: "Thundercat Club",
    city: "Madrid",
    lat: 40.426252,
    lng: -3.6957419,
    aliases: ["thundercat"],
  },
  {
    id: "samsara",
    title: "Samsara",
    city: "Madrid",
    lat: 40.41605,
    lng: -3.7009583,
    aliases: ["samsara"],
    maxMeters: 800,
  },
  {
    id: "malecon",
    title: "Malecón",
    city: "Madrid",
    lat: 40.332136,
    lng: -3.523771,
    address: "Calle de Mariano Barbacid 5, Rivas-Vaciamadrid",
    aliases: ["malecon", "el malecon"],
    maxMeters: 800,
  },
  {
    id: "elrow",
    title: "Sala Elrow / Row14",
    city: "Viladecans, Barcelona",
    lat: 41.2749296,
    lng: 2.0456994,
    aliases: ["row 14", "elrow"],
    maxMeters: 800,
  },
  {
    id: "city-hall",
    title: "City Hall",
    city: "Barcelona",
    lat: 41.3877482,
    lng: 2.1682551,
    address: "Rambla de Catalunya 2-4, Barcelona",
    aliases: ["city hall"],
    maxMeters: 800,
  },
  {
    id: "moog",
    title: "Moog",
    city: "Barcelona",
    lat: 41.3779954,
    lng: 2.1750805,
    aliases: ["moog"],
    maxMeters: 800,
  },
  {
    id: "pacha-sitges",
    title: "Pacha Sitges",
    city: "Sitges, Barcelona",
    lat: 41.2356365,
    lng: 1.8080643,
    address: "Carrer de Bonaire, Sitges",
    aliases: ["pacha sitges"],
  },
  {
    id: "biloba",
    title: "Biloba Lleida",
    city: "Lleida",
    lat: 41.6156024,
    lng: 0.6583547,
    aliases: ["biloba"],
  },
  {
    id: "passarella",
    title: "Passarel·la Empuriabrava",
    city: "Empuriabrava, Girona",
    lat: 42.2635457,
    lng: 3.1071898,
    aliases: ["passarel la", "passarella"],
    maxMeters: 1500,
  },
  {
    id: "beout",
    title: "BeOut",
    city: "Platja d'Aro, Girona",
    lat: 41.8083177,
    lng: 3.0576642,
    address: "Avinguda de s'Agaró 162, Platja d'Aro",
    aliases: ["beout"],
  },
  {
    id: "papillon",
    title: "Papillon",
    city: "Platja d'Aro, Girona",
    lat: 41.8069347,
    lng: 3.056605,
    address: "Avinguda de s'Agaró 120, Platja d'Aro",
    aliases: ["papillon"],
    maxMeters: 1500,
  },
  {
    id: "tropical-salou",
    title: "Tropical Salou",
    city: "Salou, Tarragona",
    lat: 41.0720138,
    lng: 1.1494113,
    aliases: ["tropical"],
    maxMeters: 700,
  },
  {
    id: "revolution",
    title: "Revolution Disco",
    city: "Lloret de Mar, Girona",
    lat: 41.7002784,
    lng: 2.8408883,
    aliases: ["revolution"],
    maxMeters: 1200,
  },
  {
    id: "unvrs-ibiza",
    title: "[UNVRS] Ibiza",
    city: "San Rafael, Ibiza",
    lat: 38.9577013,
    lng: 1.4077946,
    aliases: ["unvrs"],
    maxMeters: 1500,
  },
  {
    id: "cova-santa",
    title: "Cova Santa",
    city: "San José, Ibiza",
    lat: 38.894335,
    lng: 1.331512,
    aliases: ["cova santa"],
  },
  {
    id: "chinois",
    title: "Club Chinois",
    city: "Ibiza",
    lat: 38.9163887,
    lng: 1.4414901,
    aliases: ["chinois"],
  },
  {
    id: "akasha",
    title: "Akasha",
    city: "San Carlos, Ibiza",
    lat: 39.0424621,
    lng: 1.5667872,
    address: "Carretera de Sant Carles, Santa Eulària",
    aliases: ["akasha"],
  },
  {
    id: "octan",
    title: "Octan Ibiza",
    city: "Playa d'en Bossa, Ibiza",
    lat: 38.8929387,
    lng: 1.4069608,
    address: "Carrer de les Alzines 5, Playa d'en Bossa",
    aliases: ["octan"],
  },
  {
    id: "bcm",
    title: "BCM Planet Dance",
    city: "Calvià, Mallorca",
    lat: 39.509338,
    lng: 2.5333784,
    aliases: ["bcm"],
    maxMeters: 800,
  },
  {
    id: "nikki",
    title: "Nikki Beach Marbella",
    city: "Marbella, Málaga",
    lat: 36.4896865,
    lng: -4.7730088,
    address: "Avenida del Naviero, Elviria, Marbella",
    aliases: ["nikki beach"],
  },
  {
    id: "motel",
    title: "Motel Particulier",
    city: "Marbella, Málaga",
    lat: 36.508763,
    lng: -4.91096,
    address: "Urbanización Marbella Mar 3, Marbella",
    aliases: ["motel particulier", "motel members"],
    maxMeters: 600,
  },
  {
    id: "nao",
    title: "Nao Pool Club",
    city: "Marbella, Málaga",
    lat: 36.4955285,
    lng: -4.9640853,
    address: "Calle Los Tilos, San Pedro de Alcántara",
    aliases: ["nao pool"],
  },
  {
    id: "sala-gold",
    title: "Sala Gold",
    city: "Málaga",
    lat: 36.7221221,
    lng: -4.4212924,
    aliases: ["sala gold"],
    maxMeters: 800,
  },
  {
    id: "marau",
    title: "Marau Beach Club",
    city: "Almería",
    lat: 37.210019,
    lng: -1.8097998,
    address: "Avenida del Descubrimiento, Vera",
    aliases: ["marau"],
  },
  {
    id: "copera",
    title: "Industrial Copera",
    city: "Granada",
    lat: 37.1303922,
    lng: -3.5838425,
    aliases: ["industrial copera", "copera"],
    maxMeters: 1200,
  },
  {
    id: "penelope",
    title: "Penélope Beach Club",
    city: "Benidorm, Alicante",
    lat: 38.535815,
    lng: -0.121172,
    address: "Avenida de Alcoy, Benidorm",
    aliases: ["penelope beach"],
  },
  {
    id: "jokers",
    title: "Jokers",
    city: "Benidorm, Alicante",
    lat: 38.538437,
    lng: -0.11572,
    address: "Calle de Lepanto, Benidorm",
    aliases: ["jokers"],
    maxMeters: 800,
  },
  {
    id: "stereo",
    title: "Stereo Alicante",
    city: "Alicante",
    lat: 38.3495324,
    lng: -0.4864906,
    aliases: ["sala stereo"],
    maxMeters: 800,
  },
  {
    id: "pelicano",
    title: "Sala Pelícano",
    city: "A Coruña",
    lat: 43.3682604,
    lng: -8.400097,
    aliases: ["pelicano"],
    maxMeters: 1500,
  },
  {
    id: "bataplan",
    title: "Bataplan Disco",
    city: "San Sebastián",
    lat: 43.3154958,
    lng: -1.9888479,
    aliases: ["bataplan"],
  },
  {
    id: "sonora",
    title: "Sala Sonora",
    city: "Erandio, Vizcaya",
    lat: 43.314288,
    lng: -2.9871539,
    aliases: ["sonora"],
    maxMeters: 1200,
  },
  {
    id: "papagayo",
    title: "Papagayo Beach Club",
    city: "Adeje, Tenerife",
    lat: 28.066442,
    lng: -16.7324441,
    aliases: ["papagayo beach"],
    maxMeters: 1500,
  },
  {
    id: "monkey",
    title: "Monkey Beach Club",
    city: "Arona, Tenerife",
    lat: 28.0689449,
    lng: -16.7326389,
    address: "Avenida Rafael Puig Lluvina, Adeje",
    aliases: ["monkey beach"],
    maxMeters: 400,
  },
];

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function nameHits(title: string, aliases: readonly string[]): boolean {
  const name = normalizeName(title);
  if (!name) return false;
  const words = new Set(name.split(" "));
  return aliases.some((alias) => {
    if (name === alias || name.includes(alias)) return true;
    const parts = alias.split(" ");
    return parts.every((part) => words.has(part));
  });
}

function metersBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function sourceScore(place: Place): number {
  if (place.placeId.startsWith("featured:")) return 1;
  if (place.placeId.startsWith("osm:")) return 0;
  return 2;
}

function bestMatch(places: readonly Place[], seed: FeaturedClubSeed): Place | null {
  let best: Place | null = null;
  let bestScore = -1;
  let bestDist = Infinity;
  const limit = seed.maxMeters ?? 2000;
  for (const place of places) {
    if (!nameHits(place.title, seed.aliases)) continue;
    const dist = metersBetween(place.location, seed);
    if (dist > limit) continue;
    const score = sourceScore(place);
    if (score > bestScore || (score === bestScore && dist < bestDist)) {
      best = place;
      bestScore = score;
      bestDist = dist;
    }
  }
  return best;
}

function seedToPlace(seed: FeaturedClubSeed): Place {
  const place: Place = {
    title: seed.title,
    placeId: `featured:${seed.id}`,
    categoryName: "Discoteca",
    categories: ["Discoteca"],
    location: { lat: seed.lat, lng: seed.lng },
    city: seed.city,
    countryCode: "ES",
    url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${seed.title} ${seed.city}`)}`,
    reviewsCount: 0,
  };
  if (seed.address) place.address = seed.address;
  return place;
}

/** Añade las salas 2026 que todavía no están en el catálogo. */
export function applyFeaturedClubs(places: readonly Place[]): Place[] {
  const next = [...places];
  for (const seed of CLUBS_2026) {
    if (bestMatch(next, seed)) continue;
    next.push(seedToPlace(seed));
  }
  return next;
}

/** Un `placeId` por sala 2026. Si ya existía, gana Google Places. */
export function featuredIds2026(places: readonly Place[]): Set<string> {
  const ids = new Set<string>();
  for (const seed of CLUBS_2026) {
    const match = bestMatch(places, seed);
    if (match) ids.add(match.placeId);
  }
  return ids;
}
