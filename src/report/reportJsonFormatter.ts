import type { AssetInspectionReport } from "./reportGenerator.js";

export function formatAssetInspectionReportAsJson(
  report: AssetInspectionReport,
): string {
  return JSON.stringify(report, null, 2);
}
