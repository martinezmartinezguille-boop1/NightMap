import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { officialClubById } from "@/lib/clubPlans";
import { rememberProClub } from "@/lib/useProClubs";
import { useSession } from "@/lib/useSession";

function searchText(value: unknown): string {
  let text = "";
  if (typeof value === "string") text = value;
  else if (typeof value === "number" || typeof value === "boolean") text = String(value);
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
  return text;
}

export const Route = createFileRoute("/suscripcion_/exito")({
  validateSearch: (search: Record<string, unknown>): { simulado: string; session_id: string } => ({
    simulado: searchText(search["simulado"]),
    session_id: searchText(search["session_id"]),
  }),
  head: () => ({
    meta: [{ title: "Suscripción activa — NightMap" }],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const search = Route.useSearch();
  const { session, ready } = useSession();
  const [state, setState] = useState<"pending" | "ok" | "error">("pending");
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (!ready) return;
    const simulated = search.simulado === "1" || search.simulado === "true";
    const payload = search.session_id ? { sessionId: search.session_id } : simulated ? { simulado: true } : null;
    if (!payload || (simulated && !session?.access_token)) {
      setState("error");
      return;
    }

    const headers: Record<string, string> = { "content-type": "application/json" };
    if (session?.access_token) headers["authorization"] = `Bearer ${session.access_token}`;

    fetch("/api/suscripcion/activar", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const body: unknown = await response.json();
        const id =
          body && typeof body === "object" && "discotecaId" in body && typeof body.discotecaId === "string"
            ? body.discotecaId
            : body && typeof body === "object" && "id" in body && typeof body.id === "string"
              ? body.id
              : "";
        if (!response.ok || !id) {
          setState("error");
          return;
        }
        rememberProClub(id);
        setNombre(officialClubById(id)?.nombre ?? "La sala");
        setState("ok");
      })
      .catch(() => setState("error"));
  }, [ready, search.session_id, search.simulado, session?.access_token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-[#FFD700]/40 bg-card p-6 text-center">
        {state === "pending" && <p>Confirmando la suscripción…</p>}
        {state === "ok" && (
          <>
            <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-[#FFD700]">NightMap Pro</p>
            <h1 className="mt-3 font-display text-2xl font-bold">{nombre} ya está destacada</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              El pin del mapa pasa a dorado y sus avisos del tablón quedan arriba.
            </p>
          </>
        )}
        {state === "error" && (
          <>
            <h1 className="font-display text-2xl font-bold">No se ha activado la sala</h1>
            <p className="mt-2 text-sm text-muted-foreground">El pago no ha quedado confirmado.</p>
          </>
        )}
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-[#FFD700] px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-black"
        >
          Volver al mapa
        </Link>
      </div>
    </main>
  );
}
