import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import type { Place } from "../../types/place";
import { featuredPlaceIds } from "@/lib/featured";
import { DETAIL_ZOOM, FOCUS_ZOOM } from "@/lib/mapZoom";

const PIN_WIDTH = 34;
const PIN_HEIGHT = 46;

const glass = `<path d="M8 22h8"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5z"/>`;

function pinMarkup(gradientId: string, gold: boolean) {
  const tone = gold ? " club-pin-gold" : "";
  return `<svg class="club-pin${tone}" width="${PIN_WIDTH}" height="${PIN_HEIGHT}" viewBox="0 0 ${PIN_WIDTH} ${PIN_HEIGHT}" aria-hidden="true">
    <path d="M17 46C17 46 2 29.2 2 16.2a15 15 0 1 1 30 0C32 29.2 17 46 17 46z" fill="url(#${gradientId})"/>
    <path d="M17 42.5C17 42.5 5 28.2 5 16.6a12 12 0 1 1 24 0C29 28.2 17 42.5 17 42.5z" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1"/>
    <g fill="none" stroke="#fff" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">
      <g transform="translate(6.1 10.4) scale(0.46) rotate(-22 12 12)">${glass}</g>
      <g transform="translate(15.9 10.4) scale(0.46) rotate(22 12 12)">${glass}</g>
    </g>
  </svg>`;
}

const pinOptions = {
  className: "club-pin-wrap",
  iconSize: [PIN_WIDTH, PIN_HEIGHT] as [number, number],
  iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT] as [number, number],
};

const pinIcon = L.divIcon({ ...pinOptions, html: pinMarkup("club-pin-grad", false) });
const goldPinIcon = L.divIcon({ ...pinOptions, html: pinMarkup("club-pin-gold", true) });

function clusterIcon(cluster: L.MarkerCluster, featured: boolean) {
  const count = cluster.getChildCount();
  const size = count >= 1000 ? "xl" : count >= 100 ? "lg" : count >= 10 ? "md" : "sm";
  const px = size === "xl" ? 58 : size === "lg" ? 50 : size === "md" ? 42 : 34;
  const tone = featured ? " club-cluster-gold" : "";
  return L.divIcon({
    className: "club-cluster-wrap",
    html: `<div class="club-cluster club-cluster-${size}${tone}">${count}</div>`,
    iconSize: [px, px],
  });
}

interface NightMapProps {
  places: Place[];
  proPlaceIds: ReadonlySet<string>;
  activeId: string | null;
  focusPlace?: Place | null;
  userLocation?: { lat: number; lng: number } | null;
  onSelect: (place: Place) => void;
  onHover: (place: Place | null) => void;
  onZoomNear: (place: Place | null, zoom: number) => void;
}

function placeNearCenter(map: L.Map, list: Place[]): Place | null {
  if (map.getZoom() < DETAIL_ZOOM || list.length === 0) return null;
  const center = map.getCenter();
  let closest: Place | null = null;
  let closestMeters = Infinity;
  for (const place of list) {
    const meters = center.distanceTo([place.location.lat, place.location.lng]);
    if (meters < closestMeters) {
      closest = place;
      closestMeters = meters;
    }
  }
  return closest;
}

const USER_ZOOM = 14;

export default function NightMap({
  places,
  proPlaceIds,
  activeId,
  focusPlace = null,
  userLocation = null,
  onSelect,
  onHover,
  onZoomNear,
}: NightMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const onHoverRef = useRef(onHover);
  const hoveredIdRef = useRef<string | null>(null);
  const onZoomNearRef = useRef(onZoomNear);
  const placesRef = useRef(places);
  const focusIdRef = useRef(focusPlace?.placeId ?? null);
  const previousCountRef = useRef(0);
  const userLocatedRef = useRef(false);
  onSelectRef.current = onSelect;
  onHoverRef.current = onHover;
  onZoomNearRef.current = onZoomNear;
  placesRef.current = places;
  focusIdRef.current = focusPlace?.placeId ?? null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      center: [40.2, -3.3],
      zoom: 6,
      zoomControl: false,
      attributionControl: true,
      closePopupOnClick: false,
    });

    const syncPinScale = () => {
      const zoom = map.getZoom();
      container.classList.toggle("pins-far", zoom <= 8);
      container.classList.toggle("pins-mid", zoom > 8 && zoom <= 12);
      container.classList.toggle("pins-near", zoom > 12);
    };
    const publishZoomNear = () => {
      syncPinScale();
      onZoomNearRef.current(placeNearCenter(map, placesRef.current), map.getZoom());
    };
    syncPinScale();
    map.on("zoom", syncPinScale);
    map.on("zoomend moveend", publishZoomNear);

    const blockSelect = (event: Event) => {
      event.preventDefault();
    };
    const clearSelection = () => window.getSelection()?.removeAllRanges();
    container.addEventListener("selectstart", blockSelect);
    map.on("dragstart", clearSelection);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    requestAnimationFrame(() => {
      if (mapRef.current === map) map.invalidateSize();
    });
    return () => {
      map.off("zoom", syncPinScale);
      map.off("zoomend moveend", publishZoomNear);
      map.off("dragstart", clearSelection);
      container.removeEventListener("selectstart", blockSelect);
      map.remove();
      mapRef.current = null;
      clusterRef.current?.remove();
      clusterRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Rebuild markers only when the filtered list changes.
  // Chunks are ours: markercluster's chunkedLoading keeps a timeout that calls
  // getMinZoom after the group has already left the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let cancelled = false;
    let chunkTimer = 0;

    const featuredMarkers = new Set<L.Marker>();
    const cluster = L.markerClusterGroup({
      chunkedLoading: false,
      removeOutsideVisibleBounds: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      spiderfyDistanceMultiplier: 1.8,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 58,
      disableClusteringAtZoom: 16,
      iconCreateFunction: (group) =>
        clusterIcon(group, group.getAllChildMarkers().some((marker) => featuredMarkers.has(marker))),
    });

    const featuredIds = featuredPlaceIds(places);
    const markers: L.Marker[] = [];
    const seen = new Set<string>();
    for (const place of places) {
      if (seen.has(place.placeId)) continue;
      const { lat, lng } = place.location;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      seen.add(place.placeId);
      const featured = featuredIds.has(place.placeId) || proPlaceIds.has(place.placeId);
      const marker = L.marker([lat, lng], {
        icon: featured ? goldPinIcon : pinIcon,
        title: place.title,
        zIndexOffset: featured ? 800 : 0,
        bubblingMouseEvents: false,
        autoPanOnFocus: false,
      })
        .on("mouseover", () => {
          hoveredIdRef.current = place.placeId;
          onHoverRef.current(place);
        })
        .on("mouseout", () => {
          if (hoveredIdRef.current !== place.placeId) return;
          hoveredIdRef.current = null;
          onHoverRef.current(null);
        })
        .on("click", (event: L.LeafletMouseEvent) => {
          if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
          onSelectRef.current(place);
        });
      if (featured) featuredMarkers.add(marker);
      markers.push(marker);
      markersRef.current.set(place.placeId, marker);
    }

    map.addLayer(cluster);
    clusterRef.current = cluster;

    const CHUNK = 1500;
    let offset = 0;
    const pump = () => {
      if (cancelled || mapRef.current !== map) return;
      const next = markers.slice(offset, offset + CHUNK);
      offset += CHUNK;
      if (next.length > 0) cluster.addLayers(next);
      if (offset < markers.length) chunkTimer = window.setTimeout(pump, 24);
    };
    pump();

    const catalogGrew = previousCountRef.current > 0 && places.length > previousCountRef.current;
    previousCountRef.current = places.length;
    if (!focusIdRef.current && !userLocatedRef.current && places.length > 0 && !catalogGrew) {
      const bounds = L.latLngBounds(places.map((place) => [place.location.lat, place.location.lng] as [number, number]));
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.15), { animate: true });
    }
    return () => {
      cancelled = true;
      window.clearTimeout(chunkTimer);
      cluster.remove();
      if (clusterRef.current === cluster) clusterRef.current = null;
      markersRef.current.clear();
    };
  }, [places, proPlaceIds]);

  // Toggle active styling without rebuilding markers
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()?.querySelector(".club-pin");
      if (el) el.classList.toggle("is-active", id === activeId);
    });
  }, [activeId, places]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;
    userLocatedRef.current = true;
    const latlng = L.latLng(userLocation.lat, userLocation.lng);
    const marker = L.circleMarker(latlng, {
      radius: 8,
      color: "#f8e7b0",
      weight: 3,
      fillColor: "#60a5fa",
      fillOpacity: 1,
      interactive: false,
    }).addTo(map);
    map.flyTo(latlng, USER_ZOOM, { duration: 0.9 });
    return () => {
      marker.remove();
    };
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusPlace) return;
    map.flyTo([focusPlace.location.lat, focusPlace.location.lng], Math.max(map.getZoom(), FOCUS_ZOOM), {
      duration: 0.8,
    });
  }, [focusPlace]);

  return (
    <>
      <svg className="club-pin-defs" aria-hidden="true">
        <defs>
          <linearGradient id="club-pin-grad" x1="6" y1="2" x2="28" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#a78bfa" />
            <stop offset="0.5" stopColor="#6d28d9" />
            <stop offset="1" stopColor="#1e40af" />
          </linearGradient>
          <linearGradient id="club-pin-gold" x1="6" y1="2" x2="28" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFE58A" />
            <stop offset="0.45" stopColor="#FFD700" />
            <stop offset="1" stopColor="#B8860B" />
          </linearGradient>
        </defs>
      </svg>
      <div ref={containerRef} className="absolute inset-0 z-0" />
    </>
  );
}
