import { Bell, Map } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "./States";

/** Developer 3: pass the Leaflet map as `children`, or replace the body of this component. */
export function MapSlot({ children }: { children?: ReactNode }) {
  return <div id="map-slot" className="min-h-64">{children ?? <EmptyState icon={Map} title="Hotspot map goes here" body="The Leaflet map module plugs into this slot." />}</div>;
}

/** Developer 3: pass alert items as `children`. */
export function AlertsSlot({ children }: { children?: ReactNode }) {
  return <div id="alerts-slot">{children ?? <EmptyState icon={Bell} title="No alerts yet" body="Alerts for newly validated hotspots will show here." />}</div>;
}
