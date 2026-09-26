import { supabase } from "@/integrations/supabase/client";

export interface Discoteca {
  id: string;
  place_id: string | null;
  nombre: string;
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
  ciudad: string | null;
  foto: string | null;
  web: string | null;
  telefono: string | null;
  puntuacion: number | null;
  categoria: string | null;
  google_maps_url: string | null;
}

const PAGE_SIZE = 1000;

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function pickCoord(row: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const n = asNumber(row[key]);
    if (n != null) return n;
  }
  return null;
}

function mapDiscoteca(row: Record<string, unknown>): Discoteca {
  return {
    id: String(row.id ?? ""),
    place_id: (row.place_id as string | null) ?? null,
    nombre: String(row.nombre ?? row.name ?? "Sin nombre"),
    latitud: pickCoord(row, ["latitud", "lat", "latitude"]),
    longitud: pickCoord(row, ["longitud", "lng", "lon", "long", "longitude"]),
    direccion: (row.direccion as string | null) ?? (row.address as string | null) ?? null,
    ciudad: (row.ciudad as string | null) ?? (row.city as string | null) ?? null,
    foto: (row.foto as string | null) ?? null,
    web: (row.web as string | null) ?? null,
    telefono: (row.telefono as string | null) ?? null,
    puntuacion: asNumber(row.puntuacion),
    categoria: (row.categoria as string | null) ?? null,
    google_maps_url: (row.google_maps_url as string | null) ?? null,
  };
}

export async function fetchDiscotecas(): Promise<Discoteca[]> {
  const all: Discoteca[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("discotecas")
      .select("*")
      .order("nombre")
      .range(from, from + PAGE_SIZE - 1);

    console.log("[discotecas] respuesta Supabase", { error, data });

    if (error) throw error;
    if (!data?.length) break;

    all.push(...data.map((row) => mapDiscoteca(row as Record<string, unknown>)));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log("[discotecas] filas mapeadas", all.length, all[0] ?? null);
  return all;
}
