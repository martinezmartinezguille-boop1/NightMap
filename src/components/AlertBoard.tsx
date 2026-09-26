import { useEffect, useMemo, useState } from "react";
import type { Place } from "../../types/place";
import { FavoriteButton } from "@/components/FavoriteButton";
import {
  BASE_ALERTS,
  alertKindLabel,
  formatAlertAge,
  resolveAlerts,
  type AlertKind,
  type VenueAlert,
} from "@/lib/venueAlerts";
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

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(clock);
  }, []);

  const alerts = useMemo(() => resolveAlerts(places, BASE_ALERTS, now), [places, now]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const visible = filter === "favorites" ? alerts.filter((alert) => favoriteSet.has(alert.place.placeId)) : alerts;

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
          visible.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              now={now}
              favorite={favoriteSet.has(alert.place.placeId)}
              onToggleFavorite={() => onToggleFavorite(alert.place.placeId)}
              onSelect={() => onSelect(alert.place)}
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
  alert,
  now,
  favorite,
  onToggleFavorite,
  onSelect,
}: {
  alert: VenueAlert;
  now: number;
  favorite: boolean;
  onToggleFavorite: () => void;
  onSelect: () => void;
}) {
  const Icon = KIND_ICON[alert.kind];
  return (
    <li className="rounded-xl border border-border bg-card/80 p-3">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${kindClass(alert.kind)}`}>
            <Icon className="h-3.5 w-3.5" />
            {alertKindLabel(alert.kind)}
          </span>
          <span className="mt-1 block truncate font-display text-sm font-bold text-foreground">{alert.place.title}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{alert.message}</span>
          <span className="mt-2 block text-[11px] font-semibold text-gold">{formatAlertAge(alert.postedAt, now)}</span>
        </button>
        <FavoriteButton active={favorite} onToggle={onToggleFavorite} className="shrink-0" />
      </div>
    </li>
  );
}

function kindClass(kind: AlertKind): string {
  if (kind === "capacity") return "text-gold";
  if (kind === "schedule") return "text-neon-cyan";
  return "text-foreground";
}
