export type ClaimStatus = "pending" | "approved" | "rejected";

export interface VenueClaim {
  id: string;
  placeId: string;
  clubTitle: string;
  city: string;
  name: string;
  role: string;
  email: string;
  proofUrl: string;
  status: ClaimStatus;
  createdAt: string;
}

const STORAGE_KEY = "nightmap-venue-claims";

function readClaims(): VenueClaim[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isVenueClaim);
  } catch {
    return [];
  }
}

function isVenueClaim(value: unknown): value is VenueClaim {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row["id"] === "string" &&
    typeof row["placeId"] === "string" &&
    typeof row["clubTitle"] === "string" &&
    typeof row["city"] === "string" &&
    typeof row["name"] === "string" &&
    typeof row["role"] === "string" &&
    typeof row["email"] === "string" &&
    typeof row["proofUrl"] === "string" &&
    (row["status"] === "pending" || row["status"] === "approved" || row["status"] === "rejected") &&
    typeof row["createdAt"] === "string"
  );
}

function writeClaims(claims: VenueClaim[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
  window.dispatchEvent(new Event("nightmap-claims"));
}

export function listClaims(): VenueClaim[] {
  return readClaims().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function submitClaim(input: Omit<VenueClaim, "id" | "status" | "createdAt">): VenueClaim {
  const claim: VenueClaim = {
    ...input,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  writeClaims([claim, ...readClaims()]);
  return claim;
}

export function setClaimStatus(id: string, status: Exclude<ClaimStatus, "pending">): VenueClaim | null {
  const claims = readClaims();
  const current = claims.find((claim) => claim.id === id);
  if (!current) return null;
  const next = { ...current, status };
  writeClaims(claims.map((claim) => (claim.id === id ? next : claim)));
  return next;
}
