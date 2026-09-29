import { createFileRoute, ClientOnly, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { isListedVenue, loadPlacesWithOsm, places as seededPlaces } from "@/lib/places";
import { isNominatedPlace } from "@/lib/nominees";
import { proPlaceIds } from "@/lib/clubPlans";
import { useProClubs } from "@/lib/useProClubs";
import { DETAIL_ZOOM } from "@/lib/mapZoom";
import { distanceMeters, formatDistance, type LatLng } from "@/lib/geo";
import type { Place } from "../../types/place";
import { AlertBoard } from "@/components/AlertBoard";
import { FlashDeals } from "@/components/FlashDeals";
import { SocialSquad } from "@/components/SocialSquad";
import { PartyPassport } from "@/components/PartyPassport";
import { ClubPopupCard } from "@/components/ClubPopupCard";
import { ClubSidebar } from "@/components/ClubSidebar";
import { LoginScreen } from "@/components/LoginScreen";
import { isAdmin } from "@/lib/admin";
import { useFavorites } from "@/lib/useFavorites";
import { useSession } from "@/lib/useSession";
import { Moon, Search, MapPinOff, LocateFixed, ChevronDown, ChevronUp, Megaphone, Stamp, Users, Zap } from "lucide-react";

const NightMap = lazy(() => import("@/components/NightMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NightMap — Mapa de Discotecas y Clubs" },
      {
        name: "description",
        content:
          "Descubre discotecas y clubs nocturnos de toda España en un mapa interactivo: fotos, valoraciones, webs oficiales y cómo llegar.",
      },
      { property: "og:title", content: "NightMap — Mapa de Discotecas y Clubs" },
      {
        property: "og:description",
        content:
          "Descubre discotecas y clubs nocturnos de toda España en un mapa interactivo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function MapFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      <Moon className="h-8 w-8 animate-pulse text-neon" />
    </div>
  );
}

function passportHolder(email: string | undefined, metadata: { [key: string]: unknown }): string {
  const fullName = metadata["full_name"];
  const name = metadata["name"];
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  if (typeof name === "string" && name.trim()) return name.trim();
  const local = email?.split("@")[0]?.replace(/[._]/g, " ").trim();
  return local || "NightMap";
}

function Index() {
  const { session, ready } = useSession();
  const [places, setPlaces] = useState<Place[]>(seededPlaces);
  const [osmState, setOsmState] = useState<"loading" | "ready" | "error">("loading");
  const [categoria, setCategoria] = useState<string>("Todas");
  const [city, setCity] = useState<string>("Todas");
  const [query, setQuery] = useState("");
  const [pinned, setPinned] = useState<Place | null>(null);
  const [hovered, setHovered] = useState<Place | null>(null);
  const [zoomFocus, setZoomFocus] = useState<Place | null>(null);
  const [zoomLevel, setZoomLevel] = useState(6);
  const [dismissedZoom, setDismissedZoom] = useState<number | null>(null);
  const zoomLevelRef = useRef(6);
  const [details, setDetails] = useState<Place | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "ready" | "error">("idle");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [nearbyOpen, setNearbyOpen] = useState(true);
  const [boardOpen, setBoardOpen] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);
  const [dealsOpen, setDealsOpen] = useState(false);
  const [squadOpen, setSquadOpen] = useState(false);
  const favorites = useFavorites();
  const { extraIds } = useProClubs();

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    loadPlacesWithOsm()
      .then((list) => {
        if (cancelled) return;
        setPlaces(list);
        setOsmState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setOsmState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const listed = useMemo(
    () => places.filter((place) => isNominatedPlace(place) || isListedVenue(place)),
    [places],
  );

  const categorias = useMemo(() => {
    const counts = new Map<string, number>();
    listed.forEach((place) => {
      if (place.categoryName) counts.set(place.categoryName, (counts.get(place.categoryName) ?? 0) + 1);
    });
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name);
    return ["Todas", ...top];
  }, [listed]);

  const ciudades = useMemo(() => {
    const counts = new Map<string, number>();
    listed.forEach((place) => {
      if (place.city) counts.set(place.city, (counts.get(place.city) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [listed]);

  const filtered = useMemo(
    () =>
      listed.filter(
        (place) =>
          (categoria === "Todas" || place.categoryName === categoria) &&
          (city === "Todas" || place.city === city) &&
          (query.trim() === "" ||
            place.title.toLowerCase().includes(query.trim().toLowerCase()) ||
            (place.city ?? "").toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [listed, categoria, city, query],
  );
  const goldIds = useMemo(() => proPlaceIds(filtered, extraIds), [filtered, extraIds]);

  const zoomCard = dismissedZoom === zoomLevel ? null : zoomFocus;
  const shown = hovered ?? pinned ?? zoomCard;

  const nearby = useMemo(() => {
    if (!userLocation) return [];
    return listed
      .map((place) => ({ place, meters: distanceMeters(userLocation, place.location) }))
      .sort((a, b) => a.meters - b.meters)
      .slice(0, 5);
  }, [listed, userLocation]);

  const distanceFor = (place: Place) =>
    userLocation ? formatDistance(distanceMeters(userLocation, place.location)) : undefined;

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoError("Este navegador no permite usar la ubicación.");
      return;
    }
    setGeoStatus("locating");
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setNearbyOpen(true);
        setGeoStatus("ready");
      },
      (error) => {
        setGeoStatus("error");
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? "Activa el permiso de ubicación para centrar el mapa."
            : "No se ha podido obtener tu posición.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  };

  const closeCard = () => {
    setPinned(null);
    setHovered(null);
    setDismissedZoom(zoomLevel);
  };

  if (!ready) {
    return <div className="login-screen" aria-busy="true" />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div className="relative h-screen w-screen select-none overflow-hidden bg-background">
      <ClientOnly fallback={<MapFallback />}>
        <Suspense fallback={<MapFallback />}>
          <NightMap
            places={filtered}
            proPlaceIds={goldIds}
            activeId={shown?.placeId ?? null}
            focusPlace={pinned}
            userLocation={userLocation}
            onSelect={setPinned}
            onHover={setHovered}
            onZoomNear={(place, zoom) => {
              const wasClose = zoomLevelRef.current >= DETAIL_ZOOM;
              zoomLevelRef.current = zoom;
              setZoomLevel(zoom);
              if (zoom < DETAIL_ZOOM) {
                setZoomFocus(null);
                if (wasClose) setHovered(null);
                setDismissedZoom(null);
                return;
              }
              setZoomFocus(place);
              setDismissedZoom((current) => (current === zoom ? current : null));
            }}
          />
        </Suspense>
      </ClientOnly>

      {/* Top panel: brand + search + filters */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-4">
        <div className="pointer-events-auto mx-auto max-w-3xl space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border panel-blur p-3">
            <div className="flex items-center gap-2 pl-1">
              <Moon className="h-5 w-5 text-neon" />
              <h1 className="font-display text-lg font-bold tracking-wide text-foreground text-glow">
                NightMap
              </h1>
              <Link
                to="/suscripcion"
                className="rounded-lg border border-[#FFD700]/60 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-[#FFD700]"
              >
                Pro · 10 €
              </Link>
            </div>
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar discoteca o ciudad…"
                className="w-full select-text rounded-lg border border-input bg-secondary/70 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1 rounded-xl border border-border panel-blur p-1">
              {categorias.map((g) => (
                <button
                  key={g}
                  onClick={() => setCategoria(g)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    categoria === g
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-border panel-blur p-1">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg bg-transparent px-2 py-1.5 text-xs font-semibold text-muted-foreground focus:outline-none [&>option]:bg-card [&>option]:text-foreground"
              >
                <option value="Todas">Todas las ciudades</option>
                {ciudades.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <span className="rounded-xl border border-border panel-blur px-3 py-2 text-xs font-semibold text-muted-foreground">
              {osmState === "loading"
                ? `${filtered.length} locales · cargando`
                : osmState === "error"
                  ? `${filtered.length} locales · catálogo parcial`
                  : `${filtered.length} locales`}
            </span>
            <button
              type="button"
              onClick={() => setSquadOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/40 panel-blur px-3 py-2 text-xs font-semibold text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/10"
            >
              <Users className="h-3.5 w-3.5" />
              Cuadrilla
            </button>
            <button
              type="button"
              onClick={() => setDealsOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/40 panel-blur px-3 py-2 text-xs font-semibold text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/10"
            >
              <Zap className="h-3.5 w-3.5" />
              Ofertas
            </button>
            <button
              type="button"
              onClick={() => setPassportOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/40 panel-blur px-3 py-2 text-xs font-semibold text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/10"
            >
              <Stamp className="h-3.5 w-3.5" />
              Pasaporte
            </button>
            <button
              type="button"
              onClick={() => setBoardOpen((open) => !open)}
              aria-expanded={boardOpen}
              className={`flex items-center gap-1.5 rounded-xl border border-border panel-blur px-3 py-2 text-xs font-semibold transition-colors ${
                boardOpen ? "text-gold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Megaphone className="h-3.5 w-3.5" />
              Tablón
            </button>
            {isAdmin(session.user.email) && (
              <Link
                to="/admin"
                className="rounded-xl border border-border panel-blur px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Solicitudes
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Empty result notice */}
      {filtered.length === 0 && (
        <div className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl border border-border panel-blur px-4 py-3 text-sm text-muted-foreground">
          <MapPinOff className="h-4 w-4 text-neon" />
          No hay clubs con esos filtros.
        </div>
      )}

      {/* Marker popup card */}
      {shown && !details && (
        <ClubPopupCard
          club={shown}
          {...(distanceFor(shown) ? { distanceLabel: distanceFor(shown) } : {})}
          favorite={favorites.has(shown.placeId)}
          onToggleFavorite={() => favorites.toggle(shown.placeId)}
          onClose={closeCard}
          onOpenDetails={(club) => setDetails(club)}
        />
      )}

      {/* Detail sidebar */}
      {details && (
        <ClubSidebar
          club={details}
          {...(distanceFor(details) ? { distanceLabel: distanceFor(details) } : {})}
          favorite={favorites.has(details.placeId)}
          onToggleFavorite={() => favorites.toggle(details.placeId)}
          onClose={() => {
            setDetails(null);
            closeCard();
          }}
        />
      )}

      {boardOpen && (
        <AlertBoard
          places={listed}
          favoriteIds={favorites.ids}
          onToggleFavorite={favorites.toggle}
          onSelect={(place) => {
            setDetails(null);
            setPinned(place);
          }}
          onClose={() => setBoardOpen(false)}
        />
      )}

      {nearby.length > 0 && (
        <div className={`absolute bottom-20 left-6 z-20 rounded-2xl border border-border panel-blur p-3 ${nearbyOpen ? "w-64" : "w-auto"}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="px-1 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Cerca de ti
            </p>
            <button
              type="button"
              onClick={() => setNearbyOpen((open) => !open)}
              aria-expanded={nearbyOpen}
              aria-label={nearbyOpen ? "Minimizar clubs cercanos" : "Mostrar clubs cercanos"}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {nearbyOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
          {nearbyOpen && (
            <ul className="mt-2 space-y-1">
              {nearby.map(({ place, meters }) => (
                <li key={place.placeId}>
                  <button
                    type="button"
                    onClick={() => setPinned(place)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary"
                  >
                    <span className="truncate text-sm font-semibold text-foreground">{place.title}</span>
                    <span className="shrink-0 text-xs font-semibold text-gold">{formatDistance(meters)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={locate}
        disabled={geoStatus === "locating"}
        aria-label="Centrar en mi ubicación"
        className="absolute bottom-24 right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-border panel-blur text-foreground shadow-lg transition-transform hover:scale-105 disabled:opacity-70"
      >
        <LocateFixed className={`h-5 w-5 ${geoStatus === "locating" ? "animate-pulse text-neon" : geoStatus === "ready" ? "text-gold" : ""}`} />
      </button>
      {geoError && (
        <p className="absolute bottom-40 right-3 z-20 max-w-56 rounded-xl border border-border panel-blur px-3 py-2 text-xs text-muted-foreground">
          {geoError}
        </p>
      )}

      {passportOpen && (
        <PartyPassport
          holderName={passportHolder(session.user.email, session.user.user_metadata)}
          onClose={() => setPassportOpen(false)}
        />
      )}
      {dealsOpen && (
        <FlashDeals
          places={listed}
          onClose={() => setDealsOpen(false)}
          onSelect={(place) => {
            setDetails(null);
            setPinned(place);
          }}
        />
      )}
      {squadOpen && <SocialSquad places={listed} onClose={() => setSquadOpen(false)} />}
    </div>
  );
}
