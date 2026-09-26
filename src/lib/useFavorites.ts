import { useCallback, useEffect, useState } from "react";
import { listFavoriteIds, toggleFavorite } from "@/lib/favorites";

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => setIds(listFavoriteIds());
    refresh();
    window.addEventListener("nightmap-favorites", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("nightmap-favorites", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const toggle = useCallback((placeId: string) => {
    toggleFavorite(placeId);
    setIds(listFavoriteIds());
  }, []);

  const has = useCallback((placeId: string) => ids.includes(placeId), [ids]);

  return { ids, toggle, has };
}
