import { useEffect, useId, useMemo, useRef, useState } from "react";
import { LocateFixed, MapPinned, RefreshCw } from "lucide-react";
import type { Map as LeafletMap, Marker as LeafletMarker, TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useT } from "./ui-kit";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  detail: string;
  kind: "visit" | "area" | "base";
  number?: number;
  covered?: boolean;
}
export interface MapLine {
  points: [number, number][];
  color?: string;
}
export function ServiceMap({
  points,
  lines = [],
  title,
  selectedId,
  onSelect,
}: {
  points: MapPoint[];
  lines?: MapLine[];
  title: string;
  selectedId?: string | undefined;
  onSelect?: (id: string) => void;
}) {
  const t = useT();
  const mapId = useId();
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tilesRef = useRef<TileLayer | null>(null);
  const markers = useRef(new Map<string, LeafletMarker>());
  const select = useRef(onSelect);
  select.current = onSelect;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [retry, setRetry] = useState(0);
  // Stable map data avoids rebuilding the map on the server-state poll.
  const json = JSON.stringify({ points, lines });
  const data = useMemo(() => JSON.parse(json) as { points: MapPoint[]; lines: MapLine[] }, [json]);
  const fit = () => {
    const pts = data.points.map((p) => [p.lat, p.lng] as [number, number]);
    if (pts.length)
      mapRef.current?.fitBounds(pts, { padding: [35, 35], maxZoom: 14, animate: false });
  };
  useEffect(() => {
    let cancelled = false;
    let instance: LeafletMap | undefined;
    let observer: ResizeObserver | undefined;
    setReady(false);
    setError(false);
    setTileError(false);
    void import("leaflet")
      .then((L) => {
        if (cancelled || !node.current) return;
        const map = L.map(node.current, {
          scrollWheelZoom: false,
          maxZoom: 17,
          minZoom: 3,
          zoomControl: true,
        });
        instance = map;
        mapRef.current = map;
        map.setView([26.91, 75.73], 12);
        const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
          maxZoom: 19,
        }).addTo(map);
        tilesRef.current = tiles;
        tiles.on("tileerror", () => {
          if (!cancelled) setTileError(true);
        });
        data.lines
          .filter((l) => l.points.length > 1)
          .forEach((line) =>
            L.polyline(line.points, {
              color: line.color ?? "#1D4E89",
              weight: 3,
              dashArray: "8 7",
              opacity: 0.85,
            }).addTo(map),
          );
        data.points.forEach((p) => {
          const markerNode = document.createElement("span");
          markerNode.className =
            "service-map-marker " +
            (p.kind === "base"
              ? "is-base"
              : p.kind === "area"
                ? p.covered
                  ? "is-covered"
                  : "is-uncovered"
                : "");
          markerNode.textContent =
            p.kind === "base"
              ? "S"
              : p.kind === "area"
                ? p.covered
                  ? "✓"
                  : "–"
                : String(p.number ?? "");
          const marker = L.marker([p.lat, p.lng], {
            icon: L.divIcon({
              html: markerNode,
              className: "service-map-icon",
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            }),
            title: p.label,
            alt: p.label,
            keyboard: true,
          }).addTo(map);
          const popup = document.createElement("div");
          const heading = document.createElement("strong");
          heading.textContent = p.label;
          const detail = document.createElement("p");
          detail.textContent = p.detail;
          popup.append(heading, detail);
          marker.bindPopup(popup, { maxWidth: 230 });
          marker.on("click", () => select.current?.(p.id));
          markers.current.set(p.id, marker);
        });
        if (data.points.length)
          map.fitBounds(
            data.points.map((p) => [p.lat, p.lng] as [number, number]),
            { padding: [35, 35], maxZoom: 14, animate: false },
          );
        observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
        observer.observe(node.current);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      observer?.disconnect();
      instance?.remove();
      mapRef.current = null;
      tilesRef.current = null;
      markers.current.clear();
    };
  }, [data, retry]);
  useEffect(() => {
    const marker = selectedId ? markers.current.get(selectedId) : undefined;
    if (marker && ready) {
      marker.openPopup();
      mapRef.current?.panTo(marker.getLatLng(), { animate: false });
    }
  }, [selectedId, ready]);

  return (
    <div className="map-frame">
      <div className="map-toolbar">
        <span>
          <MapPinned size={18} aria-hidden="true" />
          <strong>{title}</strong>
        </span>
        <button type="button" className="btn btn-secondary btn-sm" disabled={!ready} onClick={fit}>
          <LocateFixed size={16} aria-hidden="true" />
          {t("Show all", "सभी दिखाएं")}
        </button>
      </div>
      <div className="map-canvas-wrap">
        <div
          ref={node}
          className="service-map-canvas"
          role="region"
          aria-label={title}
          aria-describedby={mapId}
        />
        {!ready && (
          <div className="map-loading" role="status">
            {error
              ? t(
                  "Map could not load. The visit list remains available.",
                  "नक्शा नहीं खुला। दौरा सूची उपलब्ध है।",
                )
              : t("Loading map…", "नक्शा खुल रहा है…")}
            {error && (
              <button className="btn btn-secondary" onClick={() => setRetry((n) => n + 1)}>
                {t("Retry map", "नक्शा फिर खोलें")}
              </button>
            )}
          </div>
        )}
      </div>
      {tileError && (
        <p className="map-tile-note" role="status">
          {t(
            "Background tiles are unavailable. Markers and the list still work.",
            "पृष्ठभूमि नक्शा उपलब्ध नहीं। निशान और सूची काम कर रहे हैं।",
          )}{" "}
          <button
            className="inline-flex gap-1 underline"
            onClick={() => {
              setTileError(false);
              tilesRef.current?.redraw();
            }}
          >
            <RefreshCw size={14} aria-hidden="true" />
            {t("Retry", "फिर कोशिश करें")}
          </button>
        </p>
      )}
      <p id={mapId} className="map-disclaimer">
        {data.lines.length
          ? t(
              "Fictional sample locations. Dashed lines show visit order, not road directions. No live GPS tracking.",
              "काल्पनिक उदाहरण स्थान। टूटी रेखा दौरा क्रम बताती है, सड़क दिशा नहीं। लाइव GPS ट्रैकिंग नहीं है।",
            )
          : t(
              "Fictional sample locations. Area markers are approximate centres, not NGO offices or service boundaries.",
              "काल्पनिक उदाहरण स्थान। क्षेत्र निशान अनुमानित केंद्र हैं, NGO कार्यालय या सेवा सीमाएं नहीं।",
            )}
      </p>
    </div>
  );
}
