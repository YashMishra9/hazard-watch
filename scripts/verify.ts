/**
 * Prints the whole pipeline: demo reports → ST-DBSCAN → validated clusters.
 * Run:  npm run verify
 */
import { runSTDBSCANDetailed, DEFAULT_ST_DBSCAN_OPTIONS } from "../src/lib/clustering";
import { PUNE_DEMO_REPORTS, PUNE_DEMO_GROUPS } from "../src/lib/demo-data";

const result = runSTDBSCANDetailed(PUNE_DEMO_REPORTS);

console.log("ST-DBSCAN verification on the Pune demo dataset");
console.log("Options:", JSON.stringify(DEFAULT_ST_DBSCAN_OPTIONS));
console.log(`Input reports: ${PUNE_DEMO_REPORTS.length}`);
console.log(`Validated clusters: ${result.clusters.length}`);
console.log(`Unclustered (noise / too small): ${result.unclusteredReportIds.length}\n`);

console.table(
  result.clusters.map((c) => ({
    id: c.id,
    category: c.category,
    reports: c.reportCount,
    severity: c.severity,
    lat: c.latitude,
    lon: c.longitude,
    detectedAt: c.detectedAt,
    status: c.status,
  })),
);

console.log("\nDemo groups designed to FAIL validation:");
for (const g of PUNE_DEMO_GROUPS.filter((g) => g.purpose.startsWith("fails") || g.purpose.startsWith("noise: right"))) {
  console.log(` - ${g.place} [${g.category}, ${g.reports}]: ${g.purpose}`);
}

console.log("\nSample HazardCluster JSON:");
console.log(JSON.stringify(result.clusters[0], null, 2));
