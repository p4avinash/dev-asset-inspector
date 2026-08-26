import type { AssetInspectionReport } from "../types/assetReport";

export const mockReport: AssetInspectionReport = {
  assets: [],
  duplicates: [],
  optimization: [],
  usage: [],
  impact: [],
  summary: {
    totalAssets: 7,
    usedAssets: 1,
    unusedAssets: 6,
    duplicateGroups: 1,
    wastedBytes: 13057,
    optimizationCandidates: 1,
    highSeverityCandidates: 1,
    typeMismatches: 1,
  },
};
