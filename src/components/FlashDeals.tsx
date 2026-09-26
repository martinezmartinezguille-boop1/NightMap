import { useEffect, useMemo, useState } from "react";
import type { Place } from "../../types/place";
import { useFavorites } from "@/lib/useFavorites";
import {
  formatCountdown,
  isVenueVerified,
  listPublishedDeals,
  listSubscriptions,
  offerActionLabel,
  offerKindLabel,
  publishDeal,
  searchVenues,
  toggleSubscription,
  type FlashDeal,
  type OfferKind,
} from "@/lib/flashDeals";
import { Bell, Clock, Lock, Search, ShieldCheck, Ticket, X, Zap } from "lucide-react";

const GOLD = "#D4AF37";

const UNVERIFIED_MESSAGE =
  "Esta sala todavía no está verificada. Reclama el local y espera a que el equipo confirme la identidad antes de publicar ofertas.";

type DealFilter = "all" | "favorites" | "subscriptions";

interface FlashDealsProps {
  places: readonly Place[];
  onClose: () => void;
  onSelect: (place: Place) => void;
}

export function FlashDeals({ places, onClose, onSelect }: FlashDealsProps) {
  const favorites = useFavorites();
  const [now, setNow] = useState(() => Date.now());
  const [published, setPublished] = useState<FlashDeal[]>(() => listPublishedDeals());
  const [subscriptions, setSubscriptions] = useState<string[]>(() => listSubscriptions());
  const [filter, setFilter] = useState<DealFilter>("all");
  const [used, setUsed] = useState<string[]>([]);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    const refreshDeals = () => setPublished(listPublishedDeals());
    const refreshSubs = () => setSubscriptions(listSubscriptions());
    window.addEventListener("nightmap-flash-deals", refreshDeals);
    window.addEventListener("nightmap-subscriptions", refreshSubs);
    window.addEventListener("storage", refreshDeals);
    window.addEventListener("storage", refreshSubs);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearInterval(clock);
      window.removeEventListener("nightmap-flash-deals", refreshDeals);
      window.removeEventListener("nightmap-subscriptions", refreshSubs);
      window.removeEventListener("storage", refreshDeals);
      window.removeEventListener("storage", refreshSubs);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const deals = useMemo(() => {
    const active = published.filter((deal) => deal.endsAt > now);
    const favoriteSet = new Set(favorites.ids);
    const subscriptionSet = new Set(subscriptions);
    const visible =
      filter === "favorites"
        ? active.filter((deal) => favoriteSet.has(deal.placeId))
        : filter === "subscriptions"
          ? active.filter((deal) => subscriptionSet.has(deal.placeId))
          : active;
    return visible.sort((a, b) => a.endsAt - b.endsAt);
  }, [published, now, filter, favorites.ids, subscriptions]);

  const placeById = useMemo(() => {
    const map = new Map<string, Place>();
    for (const place of places) map.set(place.placeId, place);
    return map;
  }, [places]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Cerrar ofertas" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="flash-deals-title"
        className="relative flex max-h-[min(92vh,860px)] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border bg-[#07060c] text-foreground shadow-[0_0_80px_rgba(212,175,55,0.2)]"
        style={{ borderColor: "rgba(212,175,55,0.5)" }}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl" style={{ background: "rgba(212,175,55,0.2)" }} />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-56 w-56 rounded-full bg-neon/20 blur-3xl" />

        <header className="relative flex items-start justify-between gap-4 border-b border-[#D4AF37]/25 px-6 py-5">
          <div>
            <p className="flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
              <Zap className="h-3.5 w-3.5" />
              En directo
            </p>
            <h2 id="flash-deals-title" className="mt-1 font-display text-2xl font-bold text-glow">
              Ofertas Flash
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Listas, copas y entradas que caducan esta noche.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ofertas"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-foreground transition-colors hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="relative flex gap-1 border-b border-white/10 p-2" role="tablist" aria-label="Filtrar ofertas">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
            Todas las ofertas activas
          </FilterTab>
          <FilterTab active={filter === "favorites"} onClick={() => setFilter("favorites")}>
            De mis discotecas favoritas
          </FilterTab>
          <FilterTab active={filter === "subscriptions"} onClick={() => setFilter("subscriptions")}>
            Mis suscripciones
          </FilterTab>
        </div>

        <div className="relative flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {deals.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#D4AF37]/30 bg-white/5 px-4 py-5 text-sm text-muted-foreground">
              {emptyCopy(filter, favorites.ids.length)}
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  now={now}
                  subscribed={subscriptions.includes(deal.placeId)}
                  used={used.includes(deal.id)}
                  onUse={() => {
                    const place = placeById.get(deal.placeId);
                    if (!place) return;
                    setUsed((current) => (current.includes(deal.id) ? current : [...current, deal.id]));
                    onSelect(place);
                  }}
                  onToggleSubscribe={() => {
                    toggleSubscription(deal.placeId);
                    setSubscriptions(listSubscriptions());
                  }}
                />
              ))}
            </ul>
          )}

          <PublishOffer places={places} onPublished={() => setPublished(listPublishedDeals())} />
        </div>
      </section>
    </div>
  );
}

function FilterTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition-colors ${
        active ? "text-[#1a1406]" : "text-muted-foreground hover:text-foreground"
      }`}
      style={active ? { background: `linear-gradient(180deg, #f3e2a4, ${GOLD})`, boxShadow: "0 0 18px rgba(212,175,55,0.35)" } : undefined}
    >
      {children}
    </button>
  );
}

function DealCard({
  deal,
  now,
  subscribed,
  used,
  onUse,
  onToggleSubscribe,
}: {
  deal: FlashDeal;
  now: number;
  subscribed: boolean;
  used: boolean;
  onUse: () => void;
  onToggleSubscribe: () => void;
}) {
  const remaining = deal.endsAt - now;
  const urgent = remaining < 10 * 60 * 1000;
  return (
    <li
      className="flex flex-col rounded-2xl border bg-white/5 p-4 backdrop-blur"
      style={{
        borderColor: urgent ? "rgba(212,175,55,0.85)" : "rgba(212,175,55,0.28)",
        boxShadow: urgent ? "0 0 24px rgba(212,175,55,0.28)" : "inset 0 0 30px rgba(212,175,55,0.04)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ borderColor: GOLD, color: GOLD }}>
          {offerKindLabel(deal.kind)}
        </span>
        <span className={`flex items-center gap-1.5 font-display text-lg font-bold tabular-nums ${urgent ? "animate-pulse" : ""}`} style={{ color: GOLD, textShadow: "0 0 14px rgba(212,175,55,0.55)" }}>
          <Clock className="h-4 w-4" />
          {formatCountdown(remaining)}
        </span>
      </div>
      <h3 className="mt-3 font-display text-base font-bold text-foreground">{deal.clubTitle}</h3>
      {deal.city && <p className="text-xs text-muted-foreground">{deal.city}</p>}
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{deal.detail}</p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onUse}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[#1a1406]"
          style={{ background: `linear-gradient(180deg, #f3e2a4, ${GOLD})`, boxShadow: "0 0 18px rgba(212,175,55,0.4)" }}
        >
          <Ticket className="h-3.5 w-3.5" />
          {used ? "Abierto en el mapa" : offerActionLabel(deal.kind)}
        </button>
        <button
          type="button"
          onClick={onToggleSubscribe}
          aria-pressed={subscribed}
          className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold"
          style={{ borderColor: "rgba(212,175,55,0.45)", color: subscribed ? GOLD : "rgba(255,255,255,0.72)" }}
        >
          <Bell className={`h-3.5 w-3.5 ${subscribed ? "fill-[#D4AF37]" : ""}`} />
          {subscribed ? "Suscrito" : "Avisarme"}
        </button>
      </div>
    </li>
  );
}

function PublishOffer({ places, onPublished }: { places: readonly Place[]; onPublished: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Place | null>(null);
  const [kind, setKind] = useState<OfferKind>("guestlist");
  const [detail, setDetail] = useState("");
  const [hours, setHours] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const results = searchVenues(places, query);
  const verified = selected ? isVenueVerified(selected) : false;

  const submit = () => {
    setSent(false);
    if (!selected) {
      setError("Elige la discoteca que quieres promocionar.");
      return;
    }
    if (!isVenueVerified(selected)) {
      setError(UNVERIFIED_MESSAGE);
      return;
    }
    const text = detail.trim() || offerKindLabel(kind);
    const duration = Number(hours);
    publishDeal({
      placeId: selected.placeId,
      clubTitle: selected.title,
      city: selected.city ?? "",
      kind,
      detail: text,
      endsAt: Date.now() + duration * 60 * 60 * 1000,
    });
    setError(null);
    setSent(true);
    setDetail("");
    onPublished();
  };

  return (
    <form
      className="rounded-2xl border border-[#D4AF37]/30 bg-black/40 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4" style={{ color: GOLD }} />
        <h3 className="font-display text-sm font-bold uppercase tracking-[0.16em]" style={{ color: GOLD }}>
          Publicar nueva oferta
        </h3>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        Solo un gerente de una sala verificada puede publicarla.
      </p>

      <label className="mt-4 block text-xs font-semibold text-muted-foreground">
        Discoteca
        <span className="relative mt-1 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={selected ? selected.title : query}
            onChange={(event) => {
              setSelected(null);
              setQuery(event.target.value);
              setError(null);
              setSent(false);
            }}
            placeholder="Busca la sala…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:border-[#D4AF37]/60"
          />
        </span>
      </label>
      {!selected && results.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-white/10">
          {results.map((place) => {
            const ok = isVenueVerified(place);
            return (
              <li key={place.placeId}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(place);
                    setQuery("");
                    setError(ok ? null : UNVERIFIED_MESSAGE);
                    setSent(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-white/5"
                >
                  <span>
                    <span className="block font-semibold text-foreground">{place.title}</span>
                    <span className="text-xs text-muted-foreground">{place.city}</span>
                  </span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide" style={{ color: ok ? GOLD : "rgba(255,255,255,0.45)" }}>
                    {ok ? "Verificada" : "Sin verificar"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-muted-foreground">
          Tipo de oferta
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as OfferKind)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#120f18] px-3 py-2.5 text-sm text-foreground outline-none"
          >
            <option value="guestlist">Lista gratis</option>
            <option value="twoForOne">2x1 en copas</option>
            <option value="earlyBird">Descuento anticipada</option>
          </select>
        </label>
        <label className="block text-xs font-semibold text-muted-foreground">
          Duración
          <select
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#120f18] px-3 py-2.5 text-sm text-foreground outline-none"
          >
            <option value="0.5">30 minutos</option>
            <option value="1">1 hora</option>
            <option value="2">2 horas</option>
          </select>
        </label>
      </div>
      <label className="mt-3 block text-xs font-semibold text-muted-foreground">
        Detalle
        <input
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          maxLength={140}
          placeholder="Qué incluye la oferta"
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#D4AF37]/60"
        />
      </label>

      {error && (
        <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">{error}</p>
      )}
      {sent && !error && (
        <p className="mt-3 text-sm font-semibold" style={{ color: GOLD }}>
          Oferta publicada. Ya cuenta atrás en el feed.
        </p>
      )}

      <button
        type="submit"
        className="mt-4 w-full rounded-xl px-4 py-3 font-display text-xs font-bold uppercase tracking-wider text-[#1a1406]"
        style={{ background: `linear-gradient(180deg, #f3e2a4, ${GOLD})`, boxShadow: "0 0 22px rgba(212,175,55,0.4)" }}
      >
        Publicar oferta
      </button>
    </form>
  );
}

function emptyCopy(filter: DealFilter, favoriteCount: number): string {
  if (filter === "favorites" && favoriteCount === 0) {
    return "Marca discotecas con el corazón para ver aquí solo sus ofertas.";
  }
  if (filter === "favorites") return "Tus discotecas favoritas no tienen ofertas activas ahora.";
  if (filter === "subscriptions") return "Pulsa Avisarme en una oferta para seguir esa sala.";
  return "No hay ofertas activas en este momento.";
}
