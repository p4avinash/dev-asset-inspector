import type { AssetInfo } from "../scanner/fileScanner.js";
import type { DuplicateGroup } from "./duplicateDetector.js";
import type { OptimizationResult } from "./optimizationAnalyzer.js";
import type { AssetUsageResult } from "./usageAnalyzer.js";

export type ImpactPriority = "low" | "medium" | "high" | "critical";

export type ImpactResult = {
  asset: AssetInfo;
  score: number;
  priority: ImpactPriority;
  reasons: string[];
};

const SCORE_UNUSED = 3;
const SCORE_DUPLICATE = 2;
const SCORE_TYPE_MISMATCH = 2;
const SCORE_OPTIMIZATION_LOW = 1;
const SCORE_OPTIMIZATION_HIGH = 2;

function getPriority(score: number): ImpactPriority {
  if (score >= 6) {
    return "critical";
  }

  if (score >= 4) {
    return "high";
  }

  if (score >= 2) {
    return "medium";
  }

  return "low";
}

export function analyzeImpact(
  assets: AssetInfo[],
  duplicateGroups: DuplicateGroup[],
  optimizationResults: OptimizationResult[],
  usageResults: AssetUsageResult[],
): ImpactResult[] {
  return assets.map((asset) => {
    let score = 0;
    const reasons: string[] = [];

    const usageResult = usageResults.find(
      (result) => result.asset.path === asset.path,
    );

    if (usageResult?.status === "NOT_REFERENCED") {
      score += SCORE_UNUSED;
      reasons.push("Unused asset");
    }

    const isDuplicate = duplicateGroups.some((group) =>
      group.assets.some((duplicateAsset) => duplicateAsset.path === asset.path),
    );

    if (isDuplicate) {
      score += SCORE_DUPLICATE;
      reasons.push("Duplicate asset");
    }

    if (asset.typeMismatch) {
      score += SCORE_TYPE_MISMATCH;
      reasons.push("File type mismatch");
    }

    const optimizationResult = optimizationResults.find(
      (result) => result.asset.path === asset.path,
    );

    if (optimizationResult?.isCandidate) {
      if (optimizationResult.severity === "high") {
        score += SCORE_OPTIMIZATION_HIGH;
        reasons.push("High optimization priority");
      } else {
        score += SCORE_OPTIMIZATION_LOW;
        reasons.push("Optimization opportunity");
      }
    }

    return {
      asset,
      score,
      priority: getPriority(score),
      reasons,
    };
  });
}
