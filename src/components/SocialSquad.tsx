import { useEffect, useMemo, useState } from "react";
import type { Place } from "../../types/place";
import { listCheckIns } from "@/lib/checkins";
import {
  addSquadMember,
  createSquad,
  leaveSquad,
  loadSquad,
  postSquadMessage,
  setMemberStatus,
  statusLabel,
  type NightStatus,
  type Squad,
} from "@/lib/squad";
import { House, MapPin, MessageCircle, Stamp, Users, X } from "lucide-react";

const GOLD = "#D4AF37";

interface SocialSquadProps {
  places: readonly Place[];
  onClose: () => void;
}

export function SocialSquad({ places, onClose }: SocialSquadProps) {
  const [squad, setSquad] = useState<Squad | null>(() => loadSquad());
  const [passportClub, setPassportClub] = useState("");

  useEffect(() => {
    const refresh = () => {
      setSquad(loadSquad());
      setPassportClub(listCheckIns()[0]?.clubTitle ?? "");
    };
    refresh();
    window.addEventListener("nightmap-squad", refresh);
    window.addEventListener("nightmap-checkins", refresh);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("nightmap-squad", refresh);
      window.removeEventListener("nightmap-checkins", refresh);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Cerrar cuadrilla" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="social-squad-title"
        className="relative flex max-h-[min(92vh,860px)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border bg-[#07060c] text-foreground shadow-[0_0_80px_rgba(212,175,55,0.22)]"
        style={{ borderColor: "rgba(212,175,55,0.5)" }}
      >
        <div className="pointer-events-none absolute -left-10 -top-16 h-52 w-52 rounded-full bg-neon/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-8 h-56 w-56 rounded-full blur-3xl" style={{ background: "rgba(212,175,55,0.18)" }} />

        <header className="relative flex items-start justify-between gap-4 border-b border-[#D4AF37]/25 px-6 py-5">
          <div>
            <p className="flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
              <Users className="h-3.5 w-3.5" />
              Social Night
            </p>
            <h2 id="social-squad-title" className="mt-1 font-display text-2xl font-bold text-glow">
              {squad ? squad.name : "Tu cuadrilla"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Coordina la noche con tu grupo.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar cuadrilla"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-foreground transition-colors hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="relative flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {squad ? (
            <SquadHome squad={squad} places={places} passportClub={passportClub} onChange={setSquad} />
          ) : (
            <CreateSquad onCreated={setSquad} />
          )}
        </div>
      </section>
    </div>
  );
}

function CreateSquad({ onCreated }: { onCreated: (squad: Squad) => void }) {
  const [name, setName] = useState("");
  const [nick, setNick] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim() || !nick.trim()) {
      setError("Escribe el nombre de la cuadrilla y tu nick.");
      return;
    }
    onCreated(createSquad(name, nick));
  };

  return (
    <form
      className="rounded-2xl border border-[#D4AF37]/30 bg-white/5 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <h3 className="font-display text-sm font-bold uppercase tracking-[0.16em]" style={{ color: GOLD }}>
        Crear cuadrilla
      </h3>
      <label className="mt-4 block text-xs font-semibold text-muted-foreground">
        Nombre de la cuadrilla
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          placeholder="Los de siempre"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#D4AF37]/60"
        />
      </label>
      <label className="mt-3 block text-xs font-semibold text-muted-foreground">
        Tu nick
        <input
          value={nick}
          onChange={(event) => setNick(event.target.value)}
          maxLength={24}
          placeholder="Guille"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#D4AF37]/60"
        />
      </label>
      {error && <p className="mt-3 text-sm text-destructive-foreground">{error}</p>}
      <button
        type="submit"
        className="mt-4 w-full rounded-xl px-4 py-3 font-display text-xs font-bold uppercase tracking-wider text-[#1a1406]"
        style={{ background: `linear-gradient(180deg, #f3e2a4, ${GOLD})`, boxShadow: "0 0 22px rgba(212,175,55,0.4)" }}
      >
        Generar código
      </button>
    </form>
  );
}

function SquadHome({
  squad,
  places,
  passportClub,
  onChange,
}: {
  squad: Squad;
  places: readonly Place[];
  passportClub: string;
  onChange: (squad: Squad | null) => void;
}) {
  const you = squad.members.find((member) => member.isYou);
  const [friendNick, setFriendNick] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [friendError, setFriendError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [clubQuery, setClubQuery] = useState("");

  const clubHits = useMemo(() => {
    const needle = clubQuery.trim().toLowerCase();
    if (needle.length < 2) return [];
    const hits: Place[] = [];
    for (const place of places) {
      if (!place.title.toLowerCase().includes(needle)) continue;
      hits.push(place);
      if (hits.length >= 5) break;
    }
    return hits;
  }, [places, clubQuery]);

  const invite = () => {
    const clean = friendNick.trim();
    if (!clean) {
      setFriendError("Escribe el nick de tu amigo.");
      return;
    }
    if (inviteCode.trim().toUpperCase() !== squad.code) {
      setFriendError("El código de invitación no coincide.");
      return;
    }
    if (squad.members.some((member) => member.nick.toLowerCase() === clean.toLowerCase())) {
      setFriendError("Ese nick ya está en la cuadrilla.");
      return;
    }
    const next = addSquadMember(clean);
    if (next) onChange(next);
    setFriendNick("");
    setInviteCode("");
    setFriendError(null);
  };

  const updateYou = (status: NightStatus, clubTitle: string) => {
    if (!you) return;
    const next = setMemberStatus(you.id, status, clubTitle);
    if (next) onChange(next);
  };

  const send = () => {
    if (!you || !draft.trim()) return;
    const next = postSquadMessage(you.nick, draft);
    if (next) onChange(next);
    setDraft("");
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D4AF37]/35 bg-white/5 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Código de invitación</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-[0.2em]" style={{ color: GOLD, textShadow: "0 0 16px rgba(212,175,55,0.45)" }}>
            {squad.code}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            leaveSquad();
            onChange(null);
          }}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Disolver cuadrilla
        </button>
      </div>

      <section>
        <h3 className="font-display text-sm font-bold uppercase tracking-[0.16em]" style={{ color: GOLD }}>
          Esta noche
        </h3>
        <ul className="mt-3 space-y-2">
          {squad.members.map((member) => (
            <li key={member.id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-3">
              <StatusIcon status={member.status} />
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-foreground">
                  {member.nick}
                  {member.isYou && <span className="ml-2 text-[10px] uppercase tracking-wide text-neon">Tú</span>}
                </p>
                <p className="text-sm text-muted-foreground">{statusLabel(member)}</p>
              </div>
            </li>
          ))}
        </ul>

        {you && (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <StatusButton active={you.status === "warming"} onClick={() => updateYou("warming", "")} label="En casa calentando" />
            <StatusButton
              active={you.status === "checked-in"}
              onClick={() => updateYou("checked-in", passportClub)}
              label="Check-in del pasaporte"
            />
            <div>
              <StatusButton active={you.status === "heading"} onClick={() => updateYou("heading", you.clubTitle)} label="Rumbo a una sala" />
              {you.status === "heading" && (
                <div className="mt-2">
                  <input
                    value={clubQuery}
                    onChange={(event) => setClubQuery(event.target.value)}
                    placeholder="Busca la discoteca"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-foreground outline-none"
                  />
                  {clubHits.length > 0 && (
                    <ul className="mt-1 overflow-hidden rounded-lg border border-white/10">
                      {clubHits.map((place) => (
                        <li key={place.placeId}>
                          <button
                            type="button"
                            onClick={() => {
                              updateYou("heading", place.title);
                              setClubQuery("");
                            }}
                            className="block w-full px-2 py-1.5 text-left text-xs text-foreground hover:bg-white/5"
                          >
                            {place.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {you?.status === "checked-in" && !passportClub && (
          <p className="mt-2 text-xs text-muted-foreground">Haz check-in en la ficha de una sala para estampar el Pasaporte Fiestero.</p>
        )}

        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            invite();
          }}
        >
          <input
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
            maxLength={8}
            placeholder="Código"
            aria-label="Código de invitación"
            className="w-28 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm uppercase tracking-wider text-foreground outline-none focus:border-[#D4AF37]/60"
          />
          <input
            value={friendNick}
            onChange={(event) => setFriendNick(event.target.value)}
            maxLength={24}
            placeholder="Nick de quien entra"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#D4AF37]/60"
          />
          <button type="submit" className="rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wide" style={{ borderColor: GOLD, color: GOLD }}>
            Unir
          </button>
        </form>
        {friendError && <p className="mt-2 text-xs text-destructive-foreground">{friendError}</p>}
      </section>

      <section>
        <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.16em]" style={{ color: GOLD }}>
          <MessageCircle className="h-4 w-4" />
          Muro
        </h3>
        <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto">
          {squad.posts.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-[#D4AF37]/30 px-3 py-4 text-sm text-muted-foreground">
              El muro está en silencio. Deja el primer aviso para cuadrar la salida.
            </li>
          ) : (
            squad.posts.map((post) => (
              <li key={post.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-[11px] font-semibold" style={{ color: GOLD }}>
                  {post.nick} · {formatHour(post.at)}
                </p>
                <p className="text-sm text-foreground">{post.text}</p>
              </li>
            ))
          )}
        </ul>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={140}
            placeholder="¿A qué hora quedamos?"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-foreground outline-none focus:border-neon/60"
          />
          <button
            type="submit"
            className="rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[#1a1406]"
            style={{ background: `linear-gradient(180deg, #f3e2a4, ${GOLD})` }}
          >
            Publicar
          </button>
        </form>
      </section>
    </>
  );
}

function StatusButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border px-2 py-2 text-xs font-semibold ${active ? "text-[#1a1406]" : "text-muted-foreground"}`}
      style={active ? { background: `linear-gradient(180deg, #f3e2a4, ${GOLD})`, borderColor: GOLD } : { borderColor: "rgba(255,255,255,0.12)" }}
    >
      {label}
    </button>
  );
}

function StatusIcon({ status }: { status: NightStatus }) {
  const className = "mt-0.5 h-4 w-4 shrink-0";
  if (status === "heading") return <MapPin className={className} style={{ color: GOLD }} />;
  if (status === "checked-in") return <Stamp className={`${className} text-neon`} />;
  return <House className={className} style={{ color: "rgba(255,255,255,0.55)" }} />;
}

function formatHour(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
