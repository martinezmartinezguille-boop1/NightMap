import { useState } from "react";
import type { Place } from "../../types/place";
import { matchOfficialClub } from "@/lib/clubPlans";
import { addBoardPost } from "@/lib/boardPosts";
import { useProClubs } from "@/lib/useProClubs";

export function ClubProPanel({ club }: { club: Place }) {
  const official = matchOfficialClub(club);
  const { isPro } = useProClubs();
  const [message, setMessage] = useState("");
  const [posted, setPosted] = useState(false);
  if (!official || !isPro(club)) return null;

  return (
    <section className="rounded-xl border border-[#FFD700]/60 bg-[#FFD700]/10 p-3">
      <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFD700]">NightMap Pro</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Pin dorado en el mapa. Los avisos de esta sala salen arriba en el tablón.
      </p>
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
    </section>
  );
}
