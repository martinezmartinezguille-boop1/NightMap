import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface StoredClaim {
  id: string;
  email: string;
  name: string;
  role: string;
  clubTitle: string;
  city: string;
  placeId: string;
  discotecaId: string;
  proofUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface StoredManager {
  email: string;
  discotecaId: string;
  role: string;
}

const CLAIM = "nightmap:reclamo";
const MANAGER = "nightmap:gerente";
const PLAN = "nightmap:plan";

function envValue(name: string): string {
  const fromProcess = process.env[name];
  if (typeof fromProcess === "string" && fromProcess) return fromProcess;
  const vite = import.meta.env as unknown as Record<string, string | boolean | undefined> | undefined;
  const fromVite = vite?.[name];
  return typeof fromVite === "string" ? fromVite : "";
}

function linkSecret(): string {
  return envValue("NIGHTMAP_LINK_SECRET");
}

function sign(key: string, payload: string): string {
  return createHmac("sha256", linkSecret()).update(`${key}\n${payload}`).digest("hex");
}

function signed(key: string, payload: string, signature: string): boolean {
  const secret = linkSecret();
  if (!secret || !signature) return false;
  const expected = sign(key, payload);
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

let client: SupabaseClient | null | undefined;

function database(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = envValue("SUPABASE_URL") || envValue("VITE_SUPABASE_URL");
  const key =
    envValue("SUPABASE_SERVICE_ROLE_KEY") ||
    envValue("SUPABASE_PUBLISHABLE_KEY") ||
    envValue("VITE_SUPABASE_PUBLISHABLE_KEY") ||
    envValue("VITE_SUPABASE_ANON_KEY");
  client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}

interface Row {
  id: string | number;
  nombre: string;
  direccion: string;
  web: string | null;
}

function rowId(value: unknown): string | number | null {
  if (typeof value === "string" && value) return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

async function rowsOf(prefix: string): Promise<Row[]> {
  const db = database();
  if (!db || !linkSecret()) return [];
  const { data, error } = await db.from("discotecas").select("id,nombre,direccion,web").like("nombre", `${prefix}%`);
  if (error || !Array.isArray(data)) return [];
  return data.filter((row): row is Row => {
    if (!row || typeof row !== "object") return false;
    const value = row as { id?: unknown; nombre?: unknown; direccion?: unknown };
    return rowId(value.id) !== null && typeof value.nombre === "string" && typeof value.direccion === "string";
  });
}

async function upsert(key: string, payload: string): Promise<boolean> {
  const db = database();
  const secret = linkSecret();
  if (!db || !secret) return false;
  const row = { nombre: key, direccion: payload, web: sign(key, payload) };
  const existing = await db.from("discotecas").select("id").eq("nombre", key).limit(1);
  const current = Array.isArray(existing.data) ? existing.data[0] : null;
  const id = current && typeof current === "object" && "id" in current ? rowId(current.id) : null;
  if (id !== null) {
    const updated = await db.from("discotecas").update(row).eq("id", id);
    return !updated.error;
  }
  const inserted = await db.from("discotecas").insert(row);
  return !inserted.error;
}

function parseJson(payload: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(payload);
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function listClaims(): Promise<StoredClaim[]> {
  const rows = await rowsOf(`${CLAIM}:`);
  const claims: StoredClaim[] = [];
  for (const row of rows) {
    if (!signed(row.nombre, row.direccion, row.web ?? "")) continue;
    const body = parseJson(row.direccion);
    if (!body) continue;
    const status = body["status"];
    if (status !== "pending" && status !== "approved" && status !== "rejected") continue;
    if (typeof body["email"] !== "string" || typeof body["role"] !== "string" || typeof body["clubTitle"] !== "string") continue;
    claims.push({
      id: row.nombre.slice(`${CLAIM}:`.length),
      email: body["email"],
      name: typeof body["name"] === "string" ? body["name"] : "",
      role: body["role"],
      clubTitle: body["clubTitle"],
      city: typeof body["city"] === "string" ? body["city"] : "",
      placeId: typeof body["placeId"] === "string" ? body["placeId"] : "",
      discotecaId: typeof body["discotecaId"] === "string" ? body["discotecaId"] : "",
      proofUrl: typeof body["proofUrl"] === "string" ? body["proofUrl"] : "",
      status,
      createdAt: typeof body["createdAt"] === "string" ? body["createdAt"] : "",
    });
  }
  return claims.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function saveClaim(claim: StoredClaim): Promise<boolean> {
  return upsert(`${CLAIM}:${claim.id}`, JSON.stringify(claim));
}

export async function listManagers(): Promise<StoredManager[]> {
  const rows = await rowsOf(`${MANAGER}:`);
  const managers: StoredManager[] = [];
  for (const row of rows) {
    if (!signed(row.nombre, row.direccion, row.web ?? "")) continue;
    const body = parseJson(row.direccion);
    if (!body || typeof body["email"] !== "string" || typeof body["discotecaId"] !== "string" || typeof body["role"] !== "string") {
      continue;
    }
    managers.push({ email: body["email"], discotecaId: body["discotecaId"], role: body["role"] });
  }
  return managers;
}

export async function saveManager(manager: StoredManager): Promise<boolean> {
  const email = manager.email.trim().toLowerCase();
  return upsert(`${MANAGER}:${email}`, JSON.stringify({ email, discotecaId: manager.discotecaId, role: manager.role }));
}

export async function activePlanIds(): Promise<string[]> {
  const rows = await rowsOf(`${PLAN}:`);
  const ids: string[] = [];
  for (const row of rows) {
    if (!signed(row.nombre, row.direccion, row.web ?? "")) continue;
    const body = parseJson(row.direccion);
    if (!body || body["suscripcionActiva"] !== true || typeof body["discotecaId"] !== "string") continue;
    ids.push(body["discotecaId"]);
  }
  return ids;
}

export async function savePlan(discotecaId: string, suscripcionActiva: boolean): Promise<boolean> {
  return upsert(`${PLAN}:${discotecaId}`, JSON.stringify({ discotecaId, suscripcionActiva }));
}

export function recordsReady(): boolean {
  return Boolean(database() && linkSecret());
}
