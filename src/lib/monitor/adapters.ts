import type { LoadDemoData, RunHazardAnalysis } from "@/components/monitor/contracts";
import { getPuneDemoReports } from "@/lib/demo-data";
import { runSTDBSCAN } from "@/lib/clustering";

export const loadDemoData: LoadDemoData = () => getPuneDemoReports();

export const runHazardAnalysis: RunHazardAnalysis = (reports) => runSTDBSCAN(reports);
