import type { AssetInfo } from "../scanner/fileScanner.js";

export type OptimizationRuleResult = {
  reason: string;
  score: number;
};

export type OptimizationOptions = {
  maxFileSize?: number;
  maxWidth?: number;
  maxHeight?: number;
  highSeverityScore?: number;
};

export type OptimizationRule = (
  asset: AssetInfo,
  options: OptimizationOptions,
) => OptimizationRuleResult | undefined;

const DEFAULT_MAX_FILE_SIZE = 500 * 1024;
const DEFAULT_MAX_WIDTH = 2560;
const DEFAULT_MAX_HEIGHT = 1440;

export const largeFileRule: OptimizationRule = (asset, options) => {
  const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;

  if (asset.size <= maxFileSize) {
    return undefined;
  }

  return {
    reason: "Large file size",
    score: 1,
  };
};

export const highResolutionRule: OptimizationRule = (asset, options) => {
  if (asset.width === undefined || asset.height === undefined) {
    return undefined;
  }

  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_HEIGHT;

  if (asset.width <= maxWidth && asset.height <= maxHeight) {
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
