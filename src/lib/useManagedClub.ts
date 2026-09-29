import { useEffect, useState } from "react";

export interface ManagedClub {
  discotecaId: string;
  nombre: string;
  ciudad: string;
  suscripcionActiva: boolean;
}

export function useManagedClub(accessToken: string | undefined) {
  const [club, setClub] = useState<ManagedClub | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setClub(null);
      return;
    }
    let active = true;
    fetch("/api/suscripcion/mi-sala", {
      headers: { authorization: `Bearer ${accessToken}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: unknown) => {
        if (!active) return;
        if (!body || typeof body !== "object" || !("discotecaId" in body) || typeof body.discotecaId !== "string") {
          setClub(null);
          return;
        }
        const nombre = "nombre" in body && typeof body.nombre === "string" ? body.nombre : "";
        const ciudad = "ciudad" in body && typeof body.ciudad === "string" ? body.ciudad : "";
        const suscripcionActiva = "suscripcionActiva" in body && body.suscripcionActiva === true;
        setClub({ discotecaId: body.discotecaId, nombre, ciudad, suscripcionActiva });
      })
      .catch(() => {
        if (active) setClub(null);
      });
    return () => {
      active = false;
    };
  }, [accessToken]);

  return club;
}
