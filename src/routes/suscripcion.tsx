import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { startProCheckout } from "@/lib/startProCheckout";
import { useManagedClub } from "@/lib/useManagedClub";
import { useProClubs } from "@/lib/useProClubs";
import { useSession } from "@/lib/useSession";

export const Route = createFileRoute("/suscripcion")({
  head: () => ({
    meta: [{ title: "NightMap Pro — 10 €/mes" }],
  }),
  component: SubscribePage,
});

function SubscribePage() {
  const { session, ready } = useSession();
  const managed = useManagedClub(session?.access_token);
  const { extraIds } = useProClubs();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const alreadyPro = managed ? managed.suscripcionActiva || extraIds.has(managed.discotecaId) : false;

  if (!ready) return <div className="login-screen" aria-busy="true" />;
  if (!session) return <LoginScreen />;

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-lg">
        <Link to="/" className="font-display text-xs font-bold uppercase tracking-[0.22em] text-[#FFD700]">
          NightMap
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold">NightMap Pro</h1>
        {!managed && (
          <p className="mt-3 text-sm text-muted-foreground">
            Esta suscripción aparece en el mapa cuando tu cuenta es la del gerente de una sala.
          </p>
        )}
        {managed && (
          <section className="mt-6 rounded-2xl border border-[#FFD700]/40 bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#FFD700]">{managed.ciudad}</p>
            <h2 className="mt-1 font-display text-2xl font-bold">{managed.nombre}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              El pago se aplica a esta sala. No hace falta elegirla.
            </p>
            <button
              type="button"
              disabled={pending || alreadyPro}
              onClick={() => {
                setPending(true);
                setError("");
                startProCheckout(session.access_token)
                  .then((url) => {
                    window.location.assign(url);
                  })
                  .catch((reason: unknown) => {
                    setError(reason instanceof Error ? reason.message : "No se ha podido empezar el pago.");
                    setPending(false);
                  });
              }}
              className="mt-5 w-full rounded-xl border border-[#FFD700] bg-[#FFD700] px-4 py-3 font-display text-sm font-bold text-black disabled:opacity-60"
            >
              {alreadyPro ? "Tu local ya es Pro" : pending ? "Abriendo el pago…" : "✨ Haz tu local Pro (10€/mes)"}
            </button>
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          </section>
        )}
      </div>
    </main>
  );
}
