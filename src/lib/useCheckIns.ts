import { useCallback, useEffect, useState } from "react";
import { addCheckIn, checkedInToday, listCheckIns, type CheckIn } from "@/lib/checkins";

export function useCheckIns() {
  const [items, setItems] = useState<CheckIn[]>(() => listCheckIns());

  useEffect(() => {
    const refresh = () => setItems(listCheckIns());
    refresh();
    window.addEventListener("nightmap-checkins", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("nightmap-checkins", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const checkIn = useCallback((input: { placeId: string; clubTitle: string; city: string }) => {
    const created = addCheckIn(input);
    setItems(listCheckIns());
    return created;
  }, []);

  const isCheckedToday = useCallback(
    (placeId: string) => items.some((entry) => entry.placeId === placeId && checkedInToday(placeId)),
    [items],
  );

  return { items, checkIn, isCheckedToday };
}
