import type { AssetInfo } from "../scanner/fileScanner.js";
import type { DuplicateGroup } from "../analysis/duplicateDetector.js";
import type { OptimizationResult } from "../analysis/optimizationAnalyzer.js";
import type { AssetUsageResult } from "../analysis/usageAnalyzer.js";
import type { ImpactResult } from "../analysis/impactAnalyzer.js";

export type AssetInspectionSummary = {
  totalAssets: number;
  usedAssets: number;
  unusedAssets: number;
  duplicateGroups: number;
  wastedBytes: number;
  optimizationCandidates: number;
  highSeverityCandidates: number;
  typeMismatches: number;
};

export type AssetInspectionReport = {
  assets: AssetInfo[];
  duplicates: DuplicateGroup[];
  optimization: OptimizationResult[];
  usage: AssetUsageResult[];
  impact: ImpactResult[];
  summary: AssetInspectionSummary;
};

function createSummary(
  assets: AssetInfo[],
  duplicates: DuplicateGroup[],
  optimization: OptimizationResult[],
  usage: AssetUsageResult[],
): AssetInspectionSummary {
  const usedAssets = usage.filter((result) => result.status === "USED").length;

  const unusedAssets = usage.filter(
    (result) => result.status === "NOT_REFERENCED",
  ).length;

  const optimizationCandidates = optimization.filter(
    (result) => result.isCandidate,
  );

  const wastedBytes = duplicates.reduce(
    (total, group) => total + group.wastedSize,
    0,
  );

  const typeMismatches = assets.filter((asset) => asset.typeMismatch).length;

  const highSeverityCandidates = optimizationCandidates.filter(
    (result) => result.severity === "high",
  ).length;

  return {
    totalAssets: assets.length,
    usedAssets,
    unusedAssets,
    duplicateGroups: duplicates.length,
    wastedBytes,
    optimizationCandidates: optimizationCandidates.length,
    highSeverityCandidates,
    typeMismatches,
  };
}

export function createAssetInspectionReport(
  assets: AssetInfo[],
  duplicates: DuplicateGroup[],
  optimization: OptimizationResult[],
  usage: AssetUsageResult[],
  impact: ImpactResult[],
): AssetInspectionReport {
  const summary = createSummary(assets, duplicates, optimization, usage);

  return {
    assets,
    duplicates,
    optimization,
    usage,
    impact,
    summary,
  };
}
