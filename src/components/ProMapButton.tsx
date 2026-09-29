import { useState } from "react";
import { startProCheckout } from "@/lib/startProCheckout";
import { useManagedClub } from "@/lib/useManagedClub";
import { useProClubs } from "@/lib/useProClubs";

export function ProMapButton({ accessToken }: { accessToken: string }) {
  const managed = useManagedClub(accessToken);
  const { extraIds } = useProClubs();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const alreadyPro = managed ? managed.suscripcionActiva || extraIds.has(managed.discotecaId) : false;
  if (!managed || alreadyPro) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setPending(true);
          setError("");
          startProCheckout(accessToken)
            .then((url) => {
              window.location.assign(url);
            })
            .catch((reason: unknown) => {
              setError(reason instanceof Error ? reason.message : "No se ha podido empezar el pago.");
              setPending(false);
            });
        }}
        className="rounded-full border border-[#FFD700]/75 bg-black/50 px-4 py-2 font-display text-xs font-semibold tracking-wide text-[#FFD700] shadow-[0_0_18px_rgba(255,215,0,0.16)] backdrop-blur transition-colors hover:border-[#FFD700] hover:bg-[#FFD700]/10 disabled:opacity-60"
      >
        {pending ? "Abriendo el pago…" : "✨ Haz tu local Pro (10€/mes)"}
      </button>
      {error && <p className="text-[11px] text-red-300">{error}</p>}
    </div>
  );
}
