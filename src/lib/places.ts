import dataset from "../../dataset_crawler-google-places_2026-09-23_12-44-36-823.json";
import nominatedVenues from "../../nominated-venues.json";
import { supabase } from "@/integrations/supabase/client";
import type { OpeningHour, Place, ReviewDistribution } from "../../types/place";
import { applyFeaturedClubs } from "./featuredClubs2026";

const DEFAULT_PAGE_SIZE = 1000;

/**
 * Añade aquí más imports JSON y mételos en el array para fusionarlos con el resto.
 * Los duplicados se descartan por `placeId` (gana el primero).
 */
export const jsonDatasets: readonly unknown[] = [dataset, nominatedVenues];

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function readLocation(row: Record<string, unknown>): { lat: number; lng: number } | null {
  const nested = row.location;
  if (nested && typeof nested === "object") {
    const coords = nested as Record<string, unknown>;
    const lat = asNumber(coords.lat);
    const lng = asNumber(coords.lng);
    if (lat != null && lng != null) return { lat, lng };
  }
  const lat = asNumber(row.latitud ?? row.lat ?? row.latitude);
  const lng = asNumber(row.longitud ?? row.lng ?? row.lon ?? row.longitude);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

function readReviews(value: unknown): ReviewDistribution | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  const oneStar = row.oneStar;
  const twoStar = row.twoStar;
  const threeStar = row.threeStar;
  const fourStar = row.fourStar;
  const fiveStar = row.fiveStar;
  if (
    typeof oneStar !== "number" ||
    typeof twoStar !== "number" ||
    typeof threeStar !== "number" ||
    typeof fourStar !== "number" ||
    typeof fiveStar !== "number"
  ) {
    return undefined;
  }
  return { oneStar, twoStar, threeStar, fourStar, fiveStar };
}

function readHours(value: unknown): OpeningHour[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const hours: OpeningHour[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.day === "string" && typeof row.hours === "string") {
      hours.push({ day: row.day, hours: row.hours });
    }
  }
  return hours;
}

export function toPlace(value: unknown): Place | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const location = readLocation(row);
  const title = readString(row.title) ?? readString(row.nombre) ?? readString(row.name);
  const placeId = readString(row.placeId) ?? readString(row.place_id) ?? readString(row.id);
  if (!location || !title || !placeId) return null;

  const categories = Array.isArray(row.categories)
    ? row.categories.filter((category): category is string => typeof category === "string")
    : readString(row.categoria)
      ? [readString(row.categoria) as string]
      : readString(row.categoryName)
        ? [readString(row.categoryName) as string]
        : [];

  const place: Place = {
    title,
    placeId,
    categoryName: readString(row.categoryName) ?? readString(row.categoria) ?? categories[0] ?? "",
    categories,
    location,
    url:
      readString(row.url) ??
      readString(row.google_maps_url) ??
      readString(row.web) ??
      `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
    reviewsCount: asNumber(row.reviewsCount) ?? 0,
  };

  const subTitle = readString(row.subTitle);
  const address = readString(row.address) ?? readString(row.direccion);
  const street = readString(row.street);
  const city = readString(row.city) ?? readString(row.ciudad);
  const postalCode = readString(row.postalCode);
  const state = readString(row.state);
  const countryCode = readString(row.countryCode);
  const phone = readString(row.phone) ?? readString(row.telefono);
  const website = readString(row.website) ?? readString(row.web);
  const imageUrl = readString(row.imageUrl) ?? readString(row.foto);
  const reviewsDistribution = readReviews(row.reviewsDistribution);
  const openingHours = readHours(row.openingHours);
  const totalScore = asNumber(row.totalScore) ?? asNumber(row.puntuacion);

  if (subTitle) place.subTitle = subTitle;
  if (address) place.address = address;
  if (street) place.street = street;
  if (city) place.city = city;
  if (postalCode) place.postalCode = postalCode;
  if (state) place.state = state;
  if (countryCode) place.countryCode = countryCode;
  if (phone) place.phone = phone;
  if (website && !website.includes("google.com/maps")) place.website = website;
  if (imageUrl) place.imageUrl = imageUrl;
  if (totalScore != null) place.totalScore = totalScore;
  if (reviewsDistribution) place.reviewsDistribution = reviewsDistribution;
  if (openingHours) place.openingHours = openingHours;
  if (typeof row.permanentlyClosed === "boolean") place.permanentlyClosed = row.permanentlyClosed;
  if (typeof row.temporarilyClosed === "boolean") place.temporarilyClosed = row.temporarilyClosed;
  if (typeof row.imagesCount === "number") place.imagesCount = row.imagesCount;

  return place;
}

const TWO_AM_MINUTES = 2 * 60;
const NOON_MINUTES = 12 * 60;

function normalizeHoursText(value: string): string {
  return value.replace(/[\u202f\u00a0]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function clockToMinutes(token: string): number | null {
  const match = token.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?$/);
  if (!match) return null;
  const hourText = match[1];
  if (!hourText) return null;
  let hour = Number(hourText);
  const minute = match[2] ? Number(match[2]) : 0;
  if (hour > 24 || minute > 59) return null;
  const meridiem = match[3]?.replace(/\./g, "");
  if (meridiem === "am" || meridiem === "pm") {
    if (hour === 12) hour = 0;
    if (meridiem === "pm") hour += 12;
  } else if (hour === 24) {
    hour = 0;
  }
  return hour * 60 + minute;
}

function closingMinutes(hours: string): number[] {
  const text = normalizeHoursText(hours);
  if (text.includes("24 horas") || text.includes("24 hours")) return [TWO_AM_MINUTES];
  if (text === "cerrado" || text === "closed") return [];
  const closings: number[] = [];
  for (const part of text.split(",")) {
    const sides = part.split(/\s+to\s+/);
    const end = sides.length >= 2 ? sides[sides.length - 1] : undefined;
    if (!end) continue;
    const minutes = clockToMinutes(end);
    if (minutes != null) closings.push(minutes);
  }
  return closings;
}

/** Cierra a las 02:00 o más tarde esa madrugada (2:00 inclusive, antes del mediodía). */
export function closesAtOrAfterTwo(place: Place): boolean {
  for (const slot of place.openingHours ?? []) {
    for (const minutes of closingMinutes(slot.hours)) {
      if (minutes >= TWO_AM_MINUTES && minutes < NOON_MINUTES) return true;
    }
  }
  return false;
}

/** Más de 50 reseñas y cierre a las 02:00 o después. */
export function isListedVenue(place: Place): boolean {
  return place.reviewsCount > 50 && closesAtOrAfterTwo(place);
}

export function loadPlaces(input: unknown): Place[] {
  if (!Array.isArray(input)) {
    throw new Error("El dataset de locales no es un array compatible con Place[].");
  }
  return input.flatMap((row) => {
    const place = toPlace(row);
    return place ? [place] : [];
  });
}

/** Une varias listas y descarta repetidos por `placeId`. Gana la primera aparición. */
export function mergePlaces(groups: readonly Place[][]): Place[] {
  const byId = new Map<string, Place>();
  for (const group of groups) {
    for (const place of group) {
      if (!byId.has(place.placeId)) byId.set(place.placeId, place);
    }
  }
  return [...byId.values()];
}

export function placesFromDatasets(datasets: readonly unknown[] = jsonDatasets): Place[] {
  return mergePlaces(datasets.map((item) => loadPlaces(item)));
}

async function readPage(response: Response): Promise<unknown[]> {
  if (!response.ok) {
    throw new Error(`Error ${response.status} al leer locales`);
  }
  const body: unknown = await response.json();
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object" && "data" in body && Array.isArray(body.data)) {
    return body.data;
  }
  throw new Error("La página de locales no es un array.");
}

/**
 * Lee un endpoint JSON paginado con `offset` y `limit` hasta agotar las páginas.
 * Acepta un array o `{ data: [...] }`.
 */
export async function fetchPlacesFromEndpoint(endpoint: string, pageSize = DEFAULT_PAGE_SIZE): Promise<Place[]> {
  const collected: Place[] = [];
  let offset = 0;

  for (;;) {
    const url = new URL(endpoint, endpoint.startsWith("http") ? undefined : "http://localhost");
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("limit", String(pageSize));
    const response = await fetch(endpoint.startsWith("http") ? url : `${url.pathname}${url.search}`);
    const rows = await readPage(response);
    if (!rows.length) break;
    collected.push(...loadPlaces(rows));
    if (rows.length < pageSize) break;
    offset += rows.length;
  }

  return mergePlaces([collected]);
}

/** Lee la tabla `discotecas` de Supabase por páginas. */
export async function fetchPlacesFromSupabase(pageSize = DEFAULT_PAGE_SIZE): Promise<Place[]> {
  const collected: Place[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("discotecas")
      .select("*")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    collected.push(...data.flatMap((row) => {
      const place = toPlace(row);
      return place ? [place] : [];
    }));
    if (data.length < pageSize) break;
    from += data.length;
  }

  return mergePlaces([collected]);
}

export interface PlaceCatalogOptions {
  datasets?: readonly unknown[];
  supabase?: boolean;
  endpoint?: string;
  pageSize?: number;
}

/** Junta JSON locales, y opcionalmente Supabase o un endpoint paginado. */
export async function loadPlaceCatalog(options: PlaceCatalogOptions = {}): Promise<Place[]> {
  const groups: Place[][] = [placesFromDatasets(options.datasets ?? jsonDatasets)];
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  if (options.supabase) groups.push(await fetchPlacesFromSupabase(pageSize));
  if (options.endpoint) groups.push(await fetchPlacesFromEndpoint(options.endpoint, pageSize));
  return mergePlaces(groups);
}

const OSM_GEOJSON_URL = "/osm_spain.geojson";

/** Una celda de 0.01° (~1,1 km). La celda vecina también cuenta como la misma zona. */
const ZONE_CELL = 100;

function normalizeVenueName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function zoneCell(lat: number, lng: number): [number, number] {
  return [Math.round(lat * ZONE_CELL), Math.round(lng * ZONE_CELL)];
}

function pointFromGeoJson(geometry: unknown): { lat: number; lng: number } | null {
  if (!geometry || typeof geometry !== "object") return null;
  const geo = geometry as { type?: unknown; coordinates?: unknown };
  if (geo.type !== "Point" || !Array.isArray(geo.coordinates)) return null;
  const lng = asNumber(geo.coordinates[0]);
  const lat = asNumber(geo.coordinates[1]);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

function osmCategory(amenity: string): "Discoteca" | "Pub" | null {
  if (amenity === "nightclub") return "Discoteca";
  if (amenity === "pub") return "Pub";
  return null;
}

function osmFeatureToPlace(feature: unknown): Place | null {
  if (!feature || typeof feature !== "object") return null;
  const row = feature as Record<string, unknown>;
  const properties = row["properties"];
  if (!properties || typeof properties !== "object") return null;
  const props = properties as Record<string, unknown>;

  const title = readString(props["name"]);
  const amenity = readString(props["amenity"]);
  if (!title || !amenity) return null;
  const categoryName = osmCategory(amenity);
  if (!categoryName) return null;

  const location = pointFromGeoJson(row["geometry"]);
  if (!location) return null;

  const featureId = row["id"];
  const osmId =
    readString(props["@id"]) ??
    (typeof featureId === "string" || typeof featureId === "number" ? String(featureId) : undefined);
  const placeId = osmId ? `osm:${osmId}` : `osm:${location.lat},${location.lng}:${normalizeVenueName(title)}`;

  const streetName = readString(props["addr:street"]);
  const houseNumber = readString(props["addr:housenumber"]);
  const street = [streetName, houseNumber].filter(Boolean).join(" ");
  const city = readString(props["addr:city"]);
  const postalCode = readString(props["addr:postcode"]);
  const phone = readString(props["phone"]) ?? readString(props["contact:phone"]);
  const website = readString(props["website"]) ?? readString(props["contact:website"]);
  const imageUrl = readString(props["image"]);

  const place: Place = {
    title,
    placeId,
    categoryName,
    categories: [categoryName],
    location,
    countryCode: "ES",
    url: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
    reviewsCount: 0,
  };

  if (street) {
    place.street = street;
    place.address = street;
  }
  if (city) place.city = city;
  if (postalCode) place.postalCode = postalCode;
  if (phone) place.phone = phone;
  if (website && !website.includes("google.com/maps")) place.website = website;
  if (imageUrl) place.imageUrl = imageUrl;

  return place;
}

/** Descarga `/osm_spain.geojson` y se queda con los puntos que tienen nombre. */
export async function fetchOsmPlaces(url = OSM_GEOJSON_URL): Promise<Place[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error ${response.status} al leer el GeoJSON de locales`);
  }
  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !("features" in body) || !Array.isArray(body.features)) {
    throw new Error("El GeoJSON no trae una lista de features.");
  }

  const places: Place[] = [];
  for (const feature of body.features) {
    const place = osmFeatureToPlace(feature);
    if (place) places.push(place);
  }
  return places;
}

function rememberVenue(index: Map<string, Set<string>>, place: Place) {
  const name = normalizeVenueName(place.title);
  if (!name) return;
  const [latCell, lngCell] = zoneCell(place.location.lat, place.location.lng);
  const key = `${latCell}:${lngCell}`;
  const names = index.get(key);
  if (names) names.add(name);
  else index.set(key, new Set([name]));
}

function venueAlreadyListed(index: Map<string, Set<string>>, place: Place): boolean {
  const name = normalizeVenueName(place.title);
  if (!name) return true;
  const [latCell, lngCell] = zoneCell(place.location.lat, place.location.lng);
  for (let dLat = -1; dLat <= 1; dLat += 1) {
    for (let dLng = -1; dLng <= 1; dLng += 1) {
      if (index.get(`${latCell + dLat}:${lngCell + dLng}`)?.has(name)) return true;
    }
  }
  return false;
}

/**
 * Junta Google Places y OpenStreetMap.
 * Si el nombre coincide en la misma zona (~1 km), se queda el local de Google.
 */
export function mergeGoogleAndOsm(googlePlaces: readonly Place[], osmPlaces: readonly Place[]): Place[] {
  const byZone = new Map<string, Set<string>>();
  const merged: Place[] = [];

  for (const place of googlePlaces) {
    merged.push(place);
    rememberVenue(byZone, place);
  }
  for (const place of osmPlaces) {
    if (venueAlreadyListed(byZone, place)) continue;
    merged.push(place);
    rememberVenue(byZone, place);
  }
  return merged;
}

/** Los 800 de Google Places más el GeoJSON de España, sin duplicar nombre y zona. */
export async function loadPlacesWithOsm(): Promise<Place[]> {
  const googlePlaces = placesFromDatasets();
  const osmPlaces = await fetchOsmPlaces();
  return applyFeaturedClubs(mergeGoogleAndOsm(googlePlaces, osmPlaces));
}

export const places: Place[] = applyFeaturedClubs(placesFromDatasets());
