import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Place } from "../../types/place";
import { PRO_PRICE_LABEL, matchOfficialClub } from "@/lib/clubPlans";
import { addBoardPost } from "@/lib/boardPosts";
import { useProClubs } from "@/lib/useProClubs";

export function ClubProPanel({ club }: { club: Place }) {
  const official = matchOfficialClub(club);
  const { isPro } = useProClubs();
  const [message, setMessage] = useState("");
  const [posted, setPosted] = useState(false);
  if (!official) return null;

  const pro = isPro(club);

  return (
    <section className={`rounded-xl border p-3 ${pro ? "border-[#FFD700]/60 bg-[#FFD700]/10" : "border-border bg-secondary/40"}`}>
      <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFD700]">
        {pro ? "NightMap Pro" : "Destacar sala"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {pro
          ? "Pin dorado en el mapa. Los avisos de esta sala salen arriba en el tablón."
          : `Suscripción de ${PRO_PRICE_LABEL}: pin dorado y avisos destacados.`}
      </p>
      {pro ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            const text = message.trim();
            if (!text) return;
            addBoardPost({ clubId: official.id, nombre: official.nombre, message: text });
            setMessage("");
            setPosted(true);
          }}
        >
          <label className="block text-xs font-semibold text-foreground" htmlFor={`aviso-${official.id}`}>
            Publicar en el tablón
          </label>
          <textarea
            id={`aviso-${official.id}`}
            value={message}
            onChange={(event) => {
              setPosted(false);
              setMessage(event.target.value);
            }}
            maxLength={180}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Sesión, horario o aviso de la sala"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-[#FFD700] px-3 py-2 text-sm font-bold text-black"
          >
            Publicar aviso destacado
          </button>
          {posted && <p className="text-xs text-[#FFD700]">Publicado arriba del tablón.</p>}
        </form>
      ) : (
        <Link
          to="/suscripcion"
          search={{ club: official.id }}
          className="mt-3 flex w-full items-center justify-center rounded-lg bg-[#FFD700] px-3 py-2 text-sm font-bold text-black"
        >
          Suscribir sala · {PRO_PRICE_LABEL}
        </Link>
      )}
    </section>
  );
}
