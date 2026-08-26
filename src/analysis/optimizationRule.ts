import type { AssetInfo } from "../scanner/fileScanner.js";

export type OptimizationRuleResult = {
  reason: string;
  score: number;
};

export type OptimizationRule = (
  asset: AssetInfo,
) => OptimizationRuleResult | undefined;

const SIZE_THRESHOLD = 500 * 1024;

const MAX_WIDTH = 2560;
const MAX_HEIGHT = 1440;

export const largeFileRule: OptimizationRule = (asset) => {
  if (asset.size <= SIZE_THRESHOLD) {
    return undefined;
  }

  return {
    reason: "Large file size",
    score: 1,
  };
};

export const highResolutionRule: OptimizationRule = (asset) => {
  if (asset.width === undefined || asset.height === undefined) {
    return undefined;
  }

  if (asset.width <= MAX_WIDTH && asset.height <= MAX_HEIGHT) {
    return undefined;
  }

  return {
    reason: "Very high image dimensions",
    score: 1,
  };
};

export const gifRule: OptimizationRule = (asset) => {
  if (asset.extension !== ".gif") {
    return undefined;
  }

  return {
    reason: "GIF may be replaceable with a more modern image format",
    score: 1,
  };
};

export const optimizationRules: OptimizationRule[] = [
  largeFileRule,
  highResolutionRule,
  gifRule,
];
