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

export type ImpactOptions = {
  weights?: {
    unused?: number;
    duplicate?: number;
    typeMismatch?: number;
    optimization?: {
      low?: number;
      high?: number;
    };
  };
};

const DEFAULT_WEIGHTS = {
  unused: 3,
  duplicate: 2,
  typeMismatch: 2,
  optimization: {
    low: 1,
    high: 2,
  },
};

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
  options: ImpactOptions = {},
): ImpactResult[] {
  const weights = {
    unused: options.weights?.unused ?? DEFAULT_WEIGHTS.unused,
    duplicate: options.weights?.duplicate ?? DEFAULT_WEIGHTS.duplicate,
    typeMismatch: options.weights?.typeMismatch ?? DEFAULT_WEIGHTS.typeMismatch,
    optimization: {
      low:
        options.weights?.optimization?.low ?? DEFAULT_WEIGHTS.optimization.low,
      high:
        options.weights?.optimization?.high ??
        DEFAULT_WEIGHTS.optimization.high,
    },
  };

  return assets.map((asset) => {
    let score = 0;
    const reasons: string[] = [];

    const usageResult = usageResults.find(
      (result) => result.asset.path === asset.path,
    );

    if (usageResult?.status === "NOT_REFERENCED") {
      score += weights.unused;
      reasons.push("Unused asset");
    }

    const isDuplicate = duplicateGroups.some((group) =>
      group.assets.some((duplicateAsset) => duplicateAsset.path === asset.path),
    );

    if (isDuplicate) {
      score += weights.duplicate;
      reasons.push("Duplicate asset");
    }

    if (asset.typeMismatch) {
      score += weights.typeMismatch;
      reasons.push("File type mismatch");
    }

    const optimizationResult = optimizationResults.find(
      (result) => result.asset.path === asset.path,
    );

    if (optimizationResult?.isCandidate) {
      if (optimizationResult.severity === "high") {
        score += weights.optimization.high;
        reasons.push("High optimization priority");
      } else {
        score += weights.optimization.low;
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
