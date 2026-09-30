"use client";

/**
 * All Leaflet-specific code lives in this file. It touches `window`, so it must
 * only ever be loaded on the client — import <HazardMap /> (the wrapper), not this.
 *
 * NOTE (Pages Router only): the CSS import below is fine in the App Router. If
 * you use the Pages Router, move it to pages/_app.tsx.
 */
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { Crosshair } from "lucide-react";
import type { HazardCluster, HazardReport } from "@/types/hazard";
import { clusterRadiusMeters, indexReports, pointsForCluster, type LatLngTuple } from "@/lib/geo";
import { CATEGORY_META, OSM_ATTRIBUTION, OSM_TILE_URL, PUNE_CENTER, PUNE_ZOOM, SEVERITY_META } from "./mapConfig";
import type { HazardMapProps } from "./mapTypes";
import { ClusterDetailsBody } from "./ClusterDetailsBody";
import { ReportPopupContent } from "./ReportPopupContent";
import { MapLegend } from "./MapLegend";

const EMPTY_REPORTS: HazardReport[] = [];
const EMPTY_CLUSTERS: HazardCluster[] = [];

/** Controlled-or-uncontrolled state helper. `controlled === undefined` => uncontrolled. */
function useSelection<T>(controlled: T | undefined, onChange: ((v: T) => void) | undefined, initial: T) {
  const [internal, setInternal] = useState<T>(initial);
  const value = controlled !== undefined ? controlled : internal;
  const set = useCallback(
    (v: T) => {
      if (controlled === undefined) setInternal(v);
      onChange?.(v);
    },
    [controlled, onChange],
  );
  return [value, set] as const;
}

function hotspotIcon(cluster: HazardCluster, selected: boolean): L.DivIcon {
  const size = selected ? 48 : 40;
  const fill = CATEGORY_META[cluster.category].color;
  const ring = SEVERITY_META[cluster.severity].color;
  const halo = selected ? "0 0 0 4px #fff, 0 0 0 7px #0f172a" : "0 0 0 3px #fff, 0 2px 8px rgba(0,0,0,.45)";
  return L.divIcon({
    className: "hazard-hotspot-icon",
    html:
      `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${fill};` +
      `border:5px solid ${ring};box-shadow:${halo};display:flex;align-items:center;justify-content:center;` +
      `color:#fff;font:700 15px/1 system-ui,sans-serif;">${cluster.reportCount}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function fitToData(map: L.Map, reports: HazardReport[], clusters: HazardCluster[]) {
  const pts: LatLngTuple[] = [
    ...reports.map((r): LatLngTuple => [r.latitude, r.longitude]),
    ...clusters.map((c): LatLngTuple => [c.latitude, c.longitude]),
  ];
  if (pts.length === 0) {
    map.setView(PUNE_CENTER, PUNE_ZOOM);
    return;
  }
  map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 15 });
}

interface ControllerProps {
  reports: HazardReport[];
  clusters: HazardCluster[];
  byId: Map<string, HazardReport>;
  selectedClusterId: string | null;
  focusedReportId: string | null;
  focusNonce: number;
  autoFit: boolean;
  markerRefs: MutableRefObject<Map<string, L.CircleMarker>>;
}

/** Imperative camera logic; must render inside <MapContainer>. */
function MapController({
  reports,
  clusters,
  byId,
  selectedClusterId,
  focusedReportId,
  focusNonce,
  autoFit,
  markerRefs,
}: ControllerProps) {
  const map = useMap();

  // Latest values for effects that must NOT re-run when only data identity changes.
  const latest = useRef({ reports, clusters, byId, focusedReportId });
  latest.current = { reports, clusters, byId, focusedReportId };

  // Keep tiles correct when the container is resized by layout (sidebars, tabs, mobile).
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);

  // Auto-fit when the data set changes.
  const signature = `${reports.length}:${reports[0]?.id ?? ""}:${reports[reports.length - 1]?.id ?? ""}|${clusters
    .map((c) => c.id)
    .join(",")}`;
  useEffect(() => {
    if (autoFit && (latest.current.reports.length > 0 || latest.current.clusters.length > 0)) {
      fitToData(map, latest.current.reports, latest.current.clusters);
    }
  }, [map, autoFit, signature]);

  // Focus a hotspot (from an alert, the map, or a details panel).
  useEffect(() => {
    if (!selectedClusterId || latest.current.focusedReportId) return;
    const cluster = latest.current.clusters.find((c) => c.id === selectedClusterId);
    if (!cluster) return;
    const pts = pointsForCluster(cluster, latest.current.byId);
    if (pts.length > 1) {
      map.flyToBounds(L.latLngBounds(pts), { padding: [70, 70], maxZoom: 16, duration: 0.6 });
    } else {
      map.flyTo([cluster.latitude, cluster.longitude], 15, { duration: 0.6 });
    }
  }, [map, selectedClusterId, focusNonce]);

  // Focus a single report and open its popup.
  useEffect(() => {
    if (!focusedReportId) return;
    const report = latest.current.byId.get(focusedReportId);
    if (!report) return;
    map.flyTo([report.latitude, report.longitude], Math.max(map.getZoom(), 17), { duration: 0.6 });
    const t = window.setTimeout(() => markerRefs.current.get(focusedReportId)?.openPopup(), 700);
    return () => window.clearTimeout(t);
  }, [map, focusedReportId, focusNonce, markerRefs]);

  return null;
}

export default function HazardMapInner({
  reports = EMPTY_REPORTS,
  clusters = EMPTY_CLUSTERS,
  selectedClusterId: selectedProp,
  onSelectCluster,
  focusedReportId: focusedProp,
  onSelectReport,
  focusNonce = 0,
  autoFit = true,
  showLegend = true,
  className = "h-[70vh] min-h-[420px]",
}: HazardMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Map<string, L.CircleMarker>>(new Map());
  const [showReports, setShowReports] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [selectedClusterId, selectCluster] = useSelection<string | null>(selectedProp, onSelectCluster, null);
  const [internalFocus, setInternalFocus] = useState<{ id: string; n: number } | null>(null);

  const byId = useMemo(() => indexReports(reports), [reports]);
  const selectedCluster = useMemo(
    () => clusters.find((c) => c.id === selectedClusterId) ?? null,
    [clusters, selectedClusterId],
  );
  const highlightedReportIds = useMemo(() => new Set(selectedCluster?.reportIds ?? []), [selectedCluster]);
  // Stable icon instances: react-leaflet calls setIcon whenever the icon object identity changes.
  const icons = useMemo(
    () => new Map(clusters.map((c) => [c.id, { normal: hotspotIcon(c, false), selected: hotspotIcon(c, true) }])),
    [clusters],
  );
  const radii = useMemo(() => new Map(clusters.map((c) => [c.id, clusterRadiusMeters(c, byId)])), [clusters, byId]);

  const focusedReportId = focusedProp !== undefined ? focusedProp : internalFocus?.id ?? null;
  const effectiveNonce = focusNonce + (internalFocus?.n ?? 0);

  const handleReportChip = (id: string) => {
    if (onSelectReport) onSelectReport(id);
    else setInternalFocus((p) => ({ id, n: (p?.n ?? 0) + 1 }));
  };

  const handleClusterClick = (id: string) => {
    setInternalFocus(null);
    selectCluster(id);
  };

  return (
    <div className={`relative isolate w-full overflow-hidden rounded-xl border border-slate-200 ${className}`}>
      <MapContainer
        ref={mapRef}
        center={PUNE_CENTER}
        zoom={PUNE_ZOOM}
        zoomControl={false}
        scrollWheelZoom
        preferCanvas
        className="h-full w-full"
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} maxZoom={19} />
        <ZoomControl position="topright" />
        <MapController
          reports={reports}
          clusters={clusters}
          byId={byId}
          selectedClusterId={selectedClusterId}
          focusedReportId={focusedReportId}
          focusNonce={effectiveNonce}
          autoFit={autoFit}
          markerRefs={markerRefs}
        />

        {/* 1. Hotspot extent circles (bottom) */}
        {showHotspots &&
          clusters.map((c) => {
            const selected = c.id === selectedClusterId;
            return (
              <Circle
                key={`extent-${c.id}`}
                center={[c.latitude, c.longitude]}
                radius={radii.get(c.id) ?? 300}
                bubblingMouseEvents={false}
                pathOptions={{
                  color: SEVERITY_META[c.severity].color,
                  fillColor: CATEGORY_META[c.category].color,
                  fillOpacity: selected ? 0.22 : 0.1,
                  weight: selected ? 3 : 2,
                  dashArray: "6 6",
                }}
                eventHandlers={{ click: () => handleClusterClick(c.id) }}
              />
            );
          })}

        {/* 2. Individual reports (small dots, above circles so they stay clickable) */}
        {showReports &&
          reports.map((r) => {
            const inSelected = highlightedReportIds.has(r.id);
            return (
              <CircleMarker
                key={r.id}
                ref={(m: L.CircleMarker | null) => {
                  if (m) markerRefs.current.set(r.id, m);
                  else markerRefs.current.delete(r.id);
                }}
                center={[r.latitude, r.longitude]}
                radius={inSelected ? 9 : 6}
                bubblingMouseEvents={false}
                pathOptions={{
                  fillColor: CATEGORY_META[r.category].color,
                  fillOpacity: 0.95,
                  color: inSelected ? "#0f172a" : "#ffffff",
                  weight: inSelected ? 3 : 2,
                }}
              >
                <Popup minWidth={220}>
                  <ReportPopupContent report={r} />
                </Popup>
              </CircleMarker>
            );
          })}

        {/* 3. Validated hotspot badges (top layer) */}
        {showHotspots &&
          clusters.map((c) => {
            const selected = c.id === selectedClusterId;
            return (
              <Marker
                key={`hotspot-${c.id}`}
                position={[c.latitude, c.longitude]}
                icon={selected ? icons.get(c.id)!.selected : icons.get(c.id)!.normal}
                zIndexOffset={selected ? 2000 : 1000}
                title={`${CATEGORY_META[c.category].label} hotspot – ${c.reportCount} reports`}
                eventHandlers={{ click: () => handleClusterClick(c.id) }}
              >
                <Popup minWidth={260} maxWidth={320}>
                  <div className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-700">Validated hotspot</div>
                  <ClusterDetailsBody cluster={c} onSelectReport={handleReportChip} />
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* Overlays. Wrapper ignores pointer events so the map stays draggable beneath. */}
      <div className="pointer-events-none absolute left-3 top-3 z-[1000] flex flex-col items-start gap-2">
        <div className="pointer-events-auto rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md">
          <span className="font-semibold text-slate-900">{reports.length}</span> reports ·{" "}
          <span className="font-semibold text-emerald-700">{clusters.length}</span> validated hotspots
        </div>
        <button
          type="button"
          onClick={() => mapRef.current && fitToData(mapRef.current, reports, clusters)}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md hover:bg-white"
        >
          <Crosshair className="h-3.5 w-3.5" aria-hidden /> Fit to data
        </button>
      </div>

      {showLegend && (
        <div className="pointer-events-none absolute bottom-6 left-3 z-[1000]">
          <MapLegend
            reportCount={reports.length}
            hotspotCount={clusters.length}
            showReports={showReports}
            showHotspots={showHotspots}
            onToggleReports={setShowReports}
            onToggleHotspots={setShowHotspots}
          />
        </div>
      )}
    </div>
  );
}
