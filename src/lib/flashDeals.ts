import type { Place } from "../../types/place";
import { listClaims } from "@/lib/venueClaims";

export type OfferKind = "guestlist" | "twoForOne" | "earlyBird";

export interface FlashDeal {
  id: string;
  placeId: string;
  clubTitle: string;
  city: string;
  kind: OfferKind;
  detail: string;
  endsAt: number;
}

const DEALS_KEY = "nightmap-flash-deals";
const SUBS_KEY = "nightmap-subscriptions";

const KIND_LABEL: Record<OfferKind, string> = {
  guestlist: "Lista gratis",
  twoForOne: "2x1 en copas",
  earlyBird: "Descuento anticipada",
};

export function offerKindLabel(kind: OfferKind): string {
  return KIND_LABEL[kind];
}

export function offerActionLabel(kind: OfferKind): string {
  if (kind === "guestlist") return "Apuntarme a la lista";
  if (kind === "twoForOne") return "Canjear 2x1";
  return "Usar descuento";
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isVenueVerified(place: Pick<Place, "placeId" | "title">): boolean {
  return listClaims().some((claim) => claim.status === "approved" && claim.placeId === place.placeId);
}

export function searchVenues(places: readonly Place[], query: string): Place[] {
  const needle = normalize(query);
  if (needle.length < 2) return [];
  const hits: Place[] = [];
  for (const place of places) {
    if (!normalize(place.title).includes(needle)) continue;
    hits.push(place);
    if (hits.length >= 24) break;
  }
  hits.sort((a, b) => venueScore(b, needle) - venueScore(a, needle));
  return hits.slice(0, 6);
}

function venueScore(place: Place, needle: string): number {
  const name = normalize(place.title);
  let score = name === needle ? 10 : 1;
  if (!place.placeId.startsWith("osm:")) score += 2;
  return score;
}

function readDeals(): FlashDeal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEALS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isFlashDeal);
  } catch {
    return [];
  }
}

function isFlashDeal(value: unknown): value is FlashDeal {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row["id"] === "string" &&
    typeof row["placeId"] === "string" &&
    typeof row["clubTitle"] === "string" &&
    typeof row["city"] === "string" &&
    (row["kind"] === "guestlist" || row["kind"] === "twoForOne" || row["kind"] === "earlyBird") &&
    typeof row["detail"] === "string" &&
    typeof row["endsAt"] === "number"
  );
}

export function listPublishedDeals(): FlashDeal[] {
  return readDeals().sort((a, b) => a.endsAt - b.endsAt);
}

export function publishDeal(input: Omit<FlashDeal, "id">): FlashDeal {
  const deal: FlashDeal = { ...input, id: crypto.randomUUID() };
  window.localStorage.setItem(DEALS_KEY, JSON.stringify([deal, ...readDeals()]));
  window.dispatchEvent(new Event("nightmap-flash-deals"));
  return deal;
}

function readSubscriptions(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SUBS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export function listSubscriptions(): string[] {
  return readSubscriptions();
}

export function toggleSubscription(placeId: string): boolean {
  const ids = readSubscriptions();
  const active = ids.includes(placeId);
  const next = active ? ids.filter((id) => id !== placeId) : [placeId, ...ids];
  window.localStorage.setItem(SUBS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("nightmap-subscriptions"));
  return !active;
}
