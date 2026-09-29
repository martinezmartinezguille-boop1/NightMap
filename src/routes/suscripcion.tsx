import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PRO_PRICE_LABEL, officialClubById, officialClubs } from "@/lib/clubPlans";
import { useProClubs } from "@/lib/useProClubs";

export const Route = createFileRoute("/suscripcion")({
  validateSearch: (search: Record<string, unknown>): { club: string } => ({
    club: typeof search.club === "string" ? search.club : "",
  }),
  head: () => ({
    meta: [{ title: "NightMap Pro — 10 €/mes" }],
  }),
  component: SubscribePage,
});

function SubscribePage() {
  const { club: clubId } = Route.useSearch();
  const club = clubId ? officialClubById(clubId) : null;
  const { extraIds } = useProClubs();
  const alreadyPro = club ? club.suscripcionActiva || extraIds.has(club.id) : false;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    if (!club) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/suscripcion/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clubId: club.id }),
      });
      const body: unknown = await response.json();
      const url = body && typeof body === "object" && "url" in body && typeof body.url === "string" ? body.url : "";
      const message = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "";
      if (!response.ok || !url) {
        setError(message || "No se ha podido empezar el pago.");
        setPending(false);
        return;
      }
      window.location.assign(url);
    } catch {
      setError("No se ha podido empezar el pago.");
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-lg">
        <Link to="/" className="font-display text-xs font-bold uppercase tracking-[0.22em] text-[#FFD700]">
          NightMap
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold">NightMap Pro</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Suscripción de {PRO_PRICE_LABEL} para la sala: pin dorado en el mapa y sus avisos del tablón arriba, con marco dorado.
        </p>

        {club ? (
          <section className="mt-6 rounded-2xl border border-[#FFD700]/40 bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#FFD700]">{club.ciudad}</p>
            <h2 className="mt-1 font-display text-2xl font-bold">{club.nombre}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{club.grupo}</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Pin dorado en el mapa, en lugar del marcador estándar.</li>
              <li>Avisos del tablón en primer lugar y con distinción dorada.</li>
            </ul>
            <button
              type="button"
              onClick={pay}
              disabled={pending || alreadyPro}
              className="mt-5 w-full rounded-xl bg-[#FFD700] px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-black disabled:opacity-60"
            >
              {alreadyPro ? "Esta sala ya es Pro" : pending ? "Abriendo el pago…" : `Suscribir sala · ${PRO_PRICE_LABEL}`}
            </button>
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          </section>
        ) : (
          <ul className="mt-6 space-y-2">
            {officialClubs.map((item) => (
              <li key={item.id}>
                <Link
                  to="/suscripcion"
                  search={{ club: item.id }}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-[#FFD700]/50"
                >
                  <span>
                    <span className="block font-semibold">{item.nombre}</span>
                    <span className="text-xs text-muted-foreground">{item.ciudad}</span>
                  </span>
                  <span className="text-xs font-semibold text-[#FFD700]">{item.suscripcionActiva ? "Pro" : PRO_PRICE_LABEL}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
