import type { SyntheticEvent } from "react";
import type { Place } from "../../types/place";
import { ClaimVenueForm } from "@/components/ClaimVenueForm";
import { CheckInButton } from "@/components/PartyPassport";
import { FavoriteButton } from "@/components/FavoriteButton";
import { X, MapPin, Phone, Star, Navigation, Globe } from "lucide-react";
import fallbackImg from "@/assets/club-house.jpg";
import { nomineeCommunity } from "@/lib/nominees";
import { ClubProPanel } from "@/components/ClubProPanel";

interface ClubSidebarProps {
  club: Place;
  distanceLabel?: string;
  favorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
}

export function ClubSidebar({ club, distanceLabel, favorite, onToggleFavorite, onClose }: ClubSidebarProps) {
  const directionsUrl =
    club.url ||
    `https://www.google.com/maps/dir/?api=1&destination=${club.location.lat},${club.location.lng}`;
  const isGoogleSearch = !club.website || club.website.includes("google.com/maps");

  const keepOpen = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <aside
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md animate-slide-in-right flex-col border-l border-border panel-blur"
      onClick={keepOpen}
      onMouseDown={keepOpen}
      onDoubleClick={keepOpen}
      onWheel={keepOpen}
      onTouchStart={keepOpen}
      onPointerDown={keepOpen}
    >
      <div className="relative h-52 shrink-0">
        <img
          src={club.imageUrl || fallbackImg}
          alt={club.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== fallbackImg) img.src = fallbackImg;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <FavoriteButton active={favorite} onToggle={onToggleFavorite} className="absolute right-16 top-4 p-2" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Cerrar ficha"
          className="absolute right-4 top-4 rounded-full bg-background/70 p-2 text-foreground backdrop-blur transition-colors hover:bg-background"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="absolute bottom-4 left-5 right-5">
          {club.categoryName && (
            <span className="rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
              {club.categoryName}
            </span>
          )}
          <h2 className={`mt-2 font-display text-2xl font-bold text-glow ${nomineeCommunity(club) ? "text-[#FFD700]" : "text-foreground"}`}>
            {club.title}
          </h2>
          {nomineeCommunity(club) && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#FFD700]">{nomineeCommunity(club)}</p>
          )}
          {club.address && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-neon" />
              {club.address}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <div className="flex flex-wrap gap-2">
          {club.totalScore != null && (
            <span className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {club.totalScore.toFixed(1)} / 5
            </span>
          )}
          {club.city && (
            <span className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              <MapPin className="h-3.5 w-3.5 text-neon-cyan" /> {club.city}
            </span>
          )}
          {distanceLabel && (
            <span className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-gold">
              <Navigation className="h-3.5 w-3.5" /> A {distanceLabel}
            </span>
          )}
          {club.phone && (
            <a
              href={`tel:${club.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
            >
              <Phone className="h-3.5 w-3.5 text-neon-cyan" /> {club.phone}
            </a>
          )}
        </div>

        {club.website && !isGoogleSearch && (
          <section>
            <h3 className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan text-glow-cyan">
              <Globe className="h-4 w-4" /> Sitio web
            </h3>
            <a
              href={club.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block break-all rounded-lg border border-border bg-secondary/60 p-3 text-sm text-neon-cyan transition-colors hover:bg-accent"
            >
              {club.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          </section>
        )}

        <section>
          <h3 className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan text-glow-cyan">
            <Navigation className="h-4 w-4" /> Cómo llegar
          </h3>
          <div className="mt-2 rounded-lg border border-border bg-secondary/60 p-3">
            {club.address && <p className="text-sm text-secondary-foreground">{club.address}</p>}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-neon-cyan/15 px-3 py-2.5 text-sm font-semibold text-neon-cyan transition-colors hover:bg-neon-cyan/25"
            >
              <Navigation className="h-4 w-4" />
              Abrir en Google Maps
            </a>
          </div>
        </section>

        <ClubProPanel club={club} />
        <ClaimVenueForm club={club} />
      </div>

      <div className="shrink-0 space-y-2 border-t border-border p-4">
        <CheckInButton club={club} />
        <a
          href={club.website || directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-transform hover:scale-[1.02] box-glow"
        >
          <Globe className="h-5 w-5" />
          {isGoogleSearch ? "Ver en Google Maps" : "Visitar Web Oficial"}
        </a>
      </div>
    </aside>
  );
}
