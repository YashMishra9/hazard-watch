import type { HazardCluster, HazardReport } from "@/types/hazard";

export interface HazardMapProps {
  /** Ordinary citizen reports (small dots). */
  reports?: HazardReport[];
  /** Already-computed validated clusters (large numbered badges + radius). */
  clusters?: HazardCluster[];

  /** Controlled selection. Omit for uncontrolled behaviour. */
  selectedClusterId?: string | null;
  onSelectCluster?: (clusterId: string | null) => void;

  /** Programmatically focus a report (fly to it and open its popup). */
  focusedReportId?: string | null;
  /** Called when a report ID chip inside a hotspot popup is clicked. */
  onSelectReport?: (reportId: string) => void;
  /**
   * Bump this number to re-run focus/fly for the same selection
   * (e.g. clicking the same alert twice after panning away).
   */
  focusNonce?: number;

  /** Fit the view to all data whenever the data set changes. Default true. */
  autoFit?: boolean;
  showLegend?: boolean;
  /** Must give the map a height. Default: "h-[70vh] min-h-[420px]". */
  className?: string;
}
