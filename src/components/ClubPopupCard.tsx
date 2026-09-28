import type { SyntheticEvent } from "react";
import type { Place } from "../../types/place";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CheckInButton } from "@/components/PartyPassport";
import { X, MapPin, Star, Globe, PanelRightOpen } from "lucide-react";
import { nomineeCommunity } from "@/lib/nominees";
import fallbackImg from "@/assets/club-house.jpg";

interface ClubPopupCardProps {
  club: Place;
  distanceLabel?: string;
  favorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  onOpenDetails: (club: Place) => void;
}

export function ClubPopupCard({
  club,
  distanceLabel,
  favorite,
  onToggleFavorite,
  onClose,
  onOpenDetails,
}: ClubPopupCardProps) {
  const isGoogleSearch = !club.website || club.website.includes("google.com/maps");
  const webLabel = isGoogleSearch ? "Ver en Google Maps" : "Comprar entradas";

  const keepOpen = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="pointer-events-auto fixed bottom-6 left-1/2 z-30 w-[min(92vw,380px)] -translate-x-1/2 animate-fade-up overflow-hidden rounded-2xl border border-border panel-blur box-glow"
      onClick={keepOpen}
      onMouseDown={keepOpen}
      onDoubleClick={keepOpen}
      onWheel={keepOpen}
      onTouchStart={keepOpen}
      onPointerDown={keepOpen}
    >
      <div className="relative h-40">
        <img
          src={club.imageUrl || fallbackImg}
          alt={club.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== fallbackImg) img.src = fallbackImg;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <FavoriteButton active={favorite} onToggle={onToggleFavorite} className="absolute right-12 top-3" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Cerrar"
          className="absolute right-3 top-3 rounded-full bg-background/70 p-1.5 text-foreground backdrop-blur transition-colors hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>
        {club.categoryName && (
          <span className="absolute left-3 top-3 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
            {club.categoryName}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className={`font-display text-lg font-bold ${nomineeCommunity(club) ? "text-[#FFD700]" : "text-foreground"}`}>
              {club.title}
            </h3>
            {nomineeCommunity(club) && (
              <p className="text-xs font-semibold uppercase tracking-wide text-[#FFD700]">{nomineeCommunity(club)}</p>
            )}
            <p className="text-sm text-muted-foreground">{club.city}</p>
          </div>
          {club.totalScore != null && (
            <span className="flex items-center gap-1 whitespace-nowrap rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-gold">
              <Star className="h-3.5 w-3.5 fill-gold" />
              {club.totalScore.toFixed(1)}
            </span>
          )}
        </div>
        {club.address && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-neon" />
            <span className="line-clamp-1">{club.address}</span>
          </p>
        )}
        {distanceLabel && <p className="mt-1 text-sm font-semibold text-gold">A {distanceLabel}</p>}
        <div className="mt-4">
          <CheckInButton club={club} />
        </div>
        <div className="mt-2 flex gap-2">
          <a
            href={club.website || club.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            <Globe className="h-4 w-4" />
            {webLabel}
          </a>
          <button
            onClick={() => onOpenDetails(club)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent"
          >
            <PanelRightOpen className="h-4 w-4" />
            Ver Ficha Completa
          </button>
        </div>
      </div>
    </div>
  );
}
