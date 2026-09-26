import type { MouseEvent } from "react";
import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  active: boolean;
  onToggle: () => void;
  className?: string;
}

export function FavoriteButton({ active, onToggle, className = "" }: FavoriteButtonProps) {
  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={`rounded-full bg-background/70 p-1.5 text-foreground backdrop-blur transition-colors hover:bg-background ${className}`}
    >
      <Heart className={`h-4 w-4 ${active ? "fill-gold text-gold" : ""}`} />
    </button>
  );
}
