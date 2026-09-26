import { useEffect, useState } from "react";
import type { Place } from "../../types/place";
import { useCheckIns } from "@/lib/useCheckIns";
import { badgesFor, rankFor, type BadgeId } from "@/lib/passport";
import {
  Compass,
  Crown,
  Lock,
  MapPin,
  Moon,
  Repeat,
  Route,
  Sparkles,
  Stamp,
  Ticket,
  Waves,
  X,
} from "lucide-react";

const GOLD = "#D4AF37";

const BADGE_ICON: Record<BadgeId, typeof Sparkles> = {
  first: Sparkles,
  explorer: Compass,
  madrid: MapPin,
  coast: Waves,
  regular: Repeat,
  nomad: Route,
  owl: Moon,
  legend: Crown,
};

interface PartyPassportProps {
  holderName: string;
  onClose: () => void;
}

export function PartyPassport({ holderName, onClose }: PartyPassportProps) {
  const { items } = useCheckIns();
  const rank = rankFor(items.length);
  const badges = badgesFor(items);
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;
  const history = items.slice(0, 8);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar pasaporte"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="party-passport-title"
        className="relative flex max-h-[min(92vh,820px)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border bg-[#07060c] text-foreground shadow-[0_0_80px_rgba(212,175,55,0.22)]"
        style={{ borderColor: "rgba(212,175,55,0.55)" }}
      >
        <div
          className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "rgba(212,175,55,0.22)" }}
        />
        <div className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-neon/20 blur-3xl" />

        <header className="relative flex items-start justify-between gap-4 border-b border-[#D4AF37]/25 px-6 py-5">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
              NightMap VIP
            </p>
            <h2 id="party-passport-title" className="mt-1 font-display text-2xl font-bold text-glow">
              Pasaporte Fiestero
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Titular <span className="font-semibold text-foreground">{holderName}</span>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div
              className="rounded-2xl border px-3 py-2 text-right"
              style={{ borderColor: "rgba(212,175,55,0.4)", background: "rgba(212,175,55,0.08)" }}
            >
              <p className="font-display text-2xl font-bold leading-none" style={{ color: GOLD }}>
                {items.length}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">puntos</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar pasaporte"
              className="rounded-full border border-white/10 bg-white/5 p-2 text-foreground transition-colors hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="relative flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section
            className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
            style={{ boxShadow: "inset 0 0 40px rgba(212,175,55,0.05)" }}
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Rango actual</p>
                <p className="mt-1 font-display text-xl font-bold" style={{ color: GOLD, textShadow: "0 0 18px rgba(212,175,55,0.45)" }}>
                  {rank.label}
                </p>
              </div>
              <p className="text-xs font-semibold text-muted-foreground">
                {rank.nextLabel ? `${rank.current}/${rank.ceiling} hacia ${rank.nextLabel}` : "Rango máximo"}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/50">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.round(rank.progress * 100)}%`,
                  background: `linear-gradient(90deg, ${GOLD}, #f3e2a4)`,
                  boxShadow: "0 0 16px rgba(212,175,55,0.7)",
                }}
              />
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>
                Sellos
              </h3>
              <p className="text-xs text-muted-foreground">
                {unlockedCount}/{badges.length} desbloqueados
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {badges.map((badge) => {
                const Icon = BADGE_ICON[badge.id];
                return (
                  <li key={badge.id}>
                    <div
                      className={`flex h-full flex-col items-center rounded-2xl border px-3 py-4 text-center transition-transform hover:-translate-y-0.5 ${
                        badge.unlocked ? "" : "border-dashed border-white/15 bg-black/30 opacity-70"
                      }`}
                      style={
                        badge.unlocked
                          ? {
                              borderColor: "rgba(212,175,55,0.8)",
                              background: "radial-gradient(circle at 50% 0%, rgba(212,175,55,0.2), rgba(7,6,12,0.2))",
                              boxShadow: "0 0 22px rgba(212,175,55,0.28)",
                            }
                          : undefined
                      }
                    >
                      <span
                        className="flex h-14 w-14 items-center justify-center rounded-full border"
                        style={
                          badge.unlocked
                            ? { borderColor: GOLD, color: GOLD, boxShadow: "inset 0 0 12px rgba(212,175,55,0.35)" }
                            : { borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.35)" }
                        }
                      >
                        {badge.unlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                      </span>
                      <p className="mt-3 font-display text-xs font-bold text-foreground">{badge.title}</p>
                      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                        {badge.unlocked ? "Desbloqueado" : badge.hint}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>
              Recorrido
            </h3>
            {history.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#D4AF37]/30 bg-white/5 px-4 py-5 text-sm text-muted-foreground">
                El pasaporte está en blanco. Haz check-in en una sala para estampar la primera visita.
              </p>
            ) : (
              <ol className="relative space-y-0 border-l border-[#D4AF37]/35 pl-5">
                {history.map((entry) => (
                  <li key={entry.id} className="relative pb-4">
                    <span
                      className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full"
                      style={{ background: GOLD, boxShadow: "0 0 10px rgba(212,175,55,0.9)" }}
                    />
                    <p className="font-display text-sm font-bold text-foreground">{entry.clubTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.city ? `${entry.city} · ` : ""}
                      {formatVisit(entry.at)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

interface CheckInButtonProps {
  club: Place;
}

export function CheckInButton({ club }: CheckInButtonProps) {
  const { checkIn, isCheckedToday } = useCheckIns();
  const done = isCheckedToday(club.placeId);
  const [justAdded, setJustAdded] = useState(false);

  const stamp = () => {
    if (done) return;
    const created = checkIn({
      placeId: club.placeId,
      clubTitle: club.title,
      city: club.city ?? "",
    });
    if (!created) return;
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2200);
  };

  return (
    <button
      type="button"
      onClick={stamp}
      disabled={done}
      className="flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-transform enabled:hover:scale-[1.02] disabled:cursor-default"
      style={
        done
          ? { borderColor: "rgba(212,175,55,0.35)", color: GOLD, background: "rgba(212,175,55,0.08)" }
          : {
              borderColor: GOLD,
              color: "#1a1406",
              background: `linear-gradient(180deg, #f3e2a4, ${GOLD})`,
              boxShadow: "0 0 22px rgba(212,175,55,0.45)",
            }
      }
    >
      {done ? <Stamp className="h-4 w-4" /> : <Ticket className="h-4 w-4" />}
      {justAdded ? "+1 punto" : done ? "Check-in hecho" : "Hacer Check-in"}
    </button>
  );
}

function formatVisit(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
