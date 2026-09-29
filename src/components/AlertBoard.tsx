import { useEffect, useMemo, useState } from "react";
import type { Place } from "../../types/place";
import { FavoriteButton } from "@/components/FavoriteButton";
import {
  BASE_ALERTS,
  alertKindLabel,
  formatAlertAge,
  resolveAlerts,
  type AlertKind,
} from "@/lib/venueAlerts";
import { matchOfficialClub } from "@/lib/clubPlans";
import { readBoardPosts, type BoardPost } from "@/lib/boardPosts";
import { useProClubs } from "@/lib/useProClubs";
import { Clock, Megaphone, Package, Users, X } from "lucide-react";

interface AlertBoardProps {
  places: readonly Place[];
  favoriteIds: readonly string[];
  onToggleFavorite: (placeId: string) => void;
  onSelect: (place: Place) => void;
  onClose: () => void;
}

type BoardFilter = "all" | "favorites";

const KIND_ICON = {
  lost: Package,
  capacity: Users,
  schedule: Clock,
} as const;

export function AlertBoard({ places, favoriteIds, onToggleFavorite, onSelect, onClose }: AlertBoardProps) {
  const [filter, setFilter] = useState<BoardFilter>("all");
  const [now, setNow] = useState(() => Date.now());
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const { isPro, extraIds } = useProClubs();

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    const sync = () => setPosts(readBoardPosts());
    sync();
    window.addEventListener("nightmap-board", sync);
    return () => window.removeEventListener("nightmap-board", sync);
  }, []);

  const alerts = useMemo(() => resolveAlerts(places, BASE_ALERTS, now), [places, now]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const rows = useMemo(() => {
    const fromAlerts = alerts.map((alert) => ({
      id: alert.id,
      place: alert.place,
      title: alert.place.title,
      message: alert.message,
      postedAt: alert.postedAt,
      kind: alert.kind,
      label: alertKindLabel(alert.kind),
      pro: isPro(alert.place),
    }));
    const fromPosts = posts.flatMap((post) => {
      const place = places.find((item) => matchOfficialClub(item)?.id === post.clubId) ?? null;
      const pro = place ? isPro(place) : extraIds.has(post.clubId);
      return [{
        id: post.id,
        place,
        title: place?.title ?? post.nombre,
        message: post.message,
        postedAt: post.postedAt,
        kind: "schedule" as const,
        label: "Aviso de sala",
        pro,
      }];
    });
    return [...fromAlerts, ...fromPosts].sort((a, b) => {
      if (a.pro !== b.pro) return a.pro ? -1 : 1;
      return b.postedAt - a.postedAt;
    });
  }, [alerts, posts, places, isPro, extraIds]);
  const visible = filter === "favorites" ? rows.filter((row) => row.place && favoriteSet.has(row.place.placeId)) : rows;

  return (
    <section
      aria-label="Tablón de alertas de salas"
      className="pointer-events-auto absolute left-16 top-36 z-20 flex max-h-[min(32rem,calc(100vh-16rem))] w-[min(92vw,22rem)] flex-col overflow-hidden rounded-2xl border border-border panel-blur"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            En directo
          </p>
          <h2 className="mt-1 flex items-center gap-2 font-display text-base font-bold text-foreground">
            <Megaphone className="h-4 w-4 text-gold" />
            Tablón de alertas
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar tablón"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-1 border-b border-border p-2" role="tablist" aria-label="Filtrar avisos">
        <BoardTab active={filter === "all"} onClick={() => setFilter("all")}>
          Todas las discotecas
        </BoardTab>
        <BoardTab active={filter === "favorites"} onClick={() => setFilter("favorites")}>
          Mis Favoritos
        </BoardTab>
      </div>

      <ul className="flex-1 space-y-2 overflow-y-auto p-3">
        {visible.length === 0 ? (
          <li className="rounded-xl border border-border bg-secondary/40 px-3 py-4 text-sm text-muted-foreground">
            {filter === "favorites"
              ? favoriteIds.length === 0
                ? "Marca una discoteca con el corazón para ver solo sus avisos."
                : "Tus salas favoritas no tienen avisos ahora."
              : "No hay avisos en este momento."}
          </li>
        ) : (
          visible.map((row) => (
            <AlertRow
              key={row.id}
              title={row.title}
              message={row.message}
              postedAt={row.postedAt}
              kind={row.kind}
              label={row.label}
              pro={row.pro}
              now={now}
              favorite={row.place ? favoriteSet.has(row.place.placeId) : false}
              onToggleFavorite={
                row.place
                  ? () => {
                      if (row.place) onToggleFavorite(row.place.placeId);
                    }
                  : undefined
              }
              onSelect={
                row.place
                  ? () => {
                      if (row.place) onSelect(row.place);
                    }
                  : undefined
              }
            />
          ))
        )}
      </ul>
    </section>
  );
}

function BoardTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function AlertRow({
  title,
  message,
  postedAt,
  kind,
  label,
  pro,
  now,
  favorite,
  onToggleFavorite,
  onSelect,
}: {
  title: string;
  message: string;
  postedAt: number;
  kind: AlertKind;
  label: string;
  pro: boolean;
  now: number;
  favorite: boolean;
  onToggleFavorite?: () => void;
  onSelect?: () => void;
}) {
  const Icon = KIND_ICON[kind];
  return (
    <li className={`rounded-xl border p-3 ${pro ? "border-[#FFD700]/70 bg-[#FFD700]/10" : "border-border bg-card/80"}`}>
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${pro ? "text-[#FFD700]" : kindClass(kind)}`}>
            <Icon className="h-3.5 w-3.5" />
            {pro ? "Pro · " : ""}
            {label}
          </span>
          <span className={`mt-1 block truncate font-display text-sm font-bold ${pro ? "text-[#FFD700]" : "text-foreground"}`}>{title}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{message}</span>
          <span className="mt-2 block text-[11px] font-semibold text-gold">{formatAlertAge(postedAt, now)}</span>
        </button>
        {onToggleFavorite && <FavoriteButton active={favorite} onToggle={onToggleFavorite} className="shrink-0" />}
      </div>
    </li>
  );
}

function kindClass(kind: AlertKind): string {
  if (kind === "capacity") return "text-gold";
  if (kind === "schedule") return "text-neon-cyan";
  return "text-foreground";
}
