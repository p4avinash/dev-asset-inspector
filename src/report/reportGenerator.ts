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

  topIssues: string[];

  highestImpactAssets: {
    asset: AssetInfo;
    score: number;
    priority: ImpactResult["priority"];
  }[];
};

export type AssetInspectionReport = {
  assets: AssetInfo[];
  duplicates: DuplicateGroup[];
  duplicateGroups?: DuplicateGroup[];
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
  impact: ImpactResult[],
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

  // --------------------------------
  // TOP ISSUES
  // --------------------------------

  const topIssues: string[] = [];

  if (unusedAssets > 0) {
    topIssues.push(`${unusedAssets} unused assets`);
  }

  if (wastedBytes > 0) {
    topIssues.push(`${wastedBytes} bytes potentially wasted by duplicates`);
  }

  if (highSeverityCandidates > 0) {
    topIssues.push(
      `${highSeverityCandidates} high-severity optimization candidates`,
    );
  }

  if (typeMismatches > 0) {
    topIssues.push(`${typeMismatches} file type mismatches`);
  }

  if (topIssues.length === 0) {
    topIssues.push("No major asset issues found");
  }

  // --------------------------------
  // HIGHEST IMPACT ASSETS
  // --------------------------------

  const highestImpactAssets = [...impact]
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((result) => ({
      asset: result.asset,
      score: result.score,
      priority: result.priority,
    }));

  return {
    totalAssets: assets.length,
    usedAssets,
    unusedAssets,
    duplicateGroups: duplicates.length,
    wastedBytes,
    optimizationCandidates: optimizationCandidates.length,
    highSeverityCandidates,
    typeMismatches,
    topIssues,
    highestImpactAssets,
  };
}

export function createAssetInspectionReport(
  assets: AssetInfo[],
  duplicates: DuplicateGroup[],
  optimization: OptimizationResult[],
  usage: AssetUsageResult[],
  impact: ImpactResult[],
): AssetInspectionReport {
  const summary = createSummary(
    assets,
    duplicates,
    optimization,
    usage,
    impact,
  );

  return {
    assets,
    duplicates,
    duplicateGroups: duplicates,
    optimization,
    usage,
    impact,
    summary,
  };
}
