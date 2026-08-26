import type { AssetInfo } from "../scanner/fileScanner.js";
import {
  optimizationRules,
  type OptimizationRuleResult,
} from "./optimizationRule.js";

type OptimizationSeverity = "low" | "high";

export type OptimizationResult = {
  asset: AssetInfo;
  isCandidate: boolean;
  score: number;
  severity?: OptimizationSeverity;
  reasons: string[];
};

export function analyzeOptimization(assets: AssetInfo[]): OptimizationResult[] {
  return assets.map((asset) => {
    const ruleResults: OptimizationRuleResult[] = [];

    for (const rule of optimizationRules) {
      const result = rule(asset);

      if (result) {
        ruleResults.push(result);
      }
    }

    const reasons = ruleResults.map((result) => result.reason);

    const score = ruleResults.reduce(
      (total, result) => total + result.score,
      0,
    );

    const isCandidate = score > 0;

    const optimizationResult: OptimizationResult = {
      asset,
      isCandidate,
      score,
      reasons,
    };

    if (isCandidate) {
      optimizationResult.severity = score >= 2 ? "high" : "low";
    }

    return optimizationResult;
  });
}
