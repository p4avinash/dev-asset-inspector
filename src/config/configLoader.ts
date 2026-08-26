import fs from "node:fs";
import path from "node:path";

export type AssetInspectorConfig = {
  assets?: {
    ignore?: string[];
    extensions?: string[];
  };

  optimization?: {
    maxFileSize?: number;
    maxWidth?: number;
    maxHeight?: number;
    highSeverityScore?: number;
  };

  impact?: {
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
};

type RawAssetInspectorConfig = {
  assets?: {
    ignore?: unknown;
    extensions?: unknown;
  };

  optimization?: {
    maxFileSize?: unknown;
    maxWidth?: unknown;
    maxHeight?: unknown;
    highSeverityScore?: unknown;
  };

  impact?: {
    weights?: {
      unused?: unknown;
      duplicate?: unknown;
      typeMismatch?: unknown;
      optimization?: {
        low?: unknown;
        high?: unknown;
      };
    };
  };
};

function validatePositiveNumber(
  value: unknown,
  fieldName: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || value <= 0) {
    throw new Error(
      `"${fieldName}" must be a positive number in asset-inspector.config.json`,
    );
  }

  return value;
}

export function loadConfig(projectRoot: string): AssetInspectorConfig {
  const configPath = path.join(projectRoot, "asset-inspector.config.json");

  if (!fs.existsSync(configPath)) {
    return {};
  }

  const content = fs.readFileSync(configPath, "utf-8");

  const config: unknown = JSON.parse(content);

  if (!config || typeof config !== "object") {
    throw new Error("Invalid asset-inspector.config.json");
  }

  const typedConfig = config as RawAssetInspectorConfig;

  // --------------------------------
  // ASSETS VALIDATION
  // --------------------------------

  if (typedConfig.assets !== undefined) {
    if (typeof typedConfig.assets !== "object" || typedConfig.assets === null) {
      throw new Error(
        '"assets" must be an object in asset-inspector.config.json',
      );
    }

    if (
      typedConfig.assets.ignore !== undefined &&
      !Array.isArray(typedConfig.assets.ignore)
    ) {
      throw new Error(
        '"assets.ignore" must be an array in asset-inspector.config.json',
      );
    }

    if (
      typedConfig.assets.extensions !== undefined &&
      !Array.isArray(typedConfig.assets.extensions)
    ) {
      throw new Error(
        '"assets.extensions" must be an array in asset-inspector.config.json',
      );
    }
  }

  // --------------------------------
  // OPTIMIZATION VALIDATION
  // --------------------------------

  if (typedConfig.optimization !== undefined) {
    if (
      typeof typedConfig.optimization !== "object" ||
      typedConfig.optimization === null
    ) {
      throw new Error(
        '"optimization" must be an object in asset-inspector.config.json',
      );
    }

    validatePositiveNumber(
      typedConfig.optimization.maxFileSize,
      "optimization.maxFileSize",
    );

    validatePositiveNumber(
      typedConfig.optimization.maxWidth,
      "optimization.maxWidth",
    );

    validatePositiveNumber(
      typedConfig.optimization.maxHeight,
      "optimization.maxHeight",
    );

    validatePositiveNumber(
      typedConfig.optimization.highSeverityScore,
      "optimization.highSeverityScore",
    );
  }

  // --------------------------------
  // IMPACT VALIDATION
  // --------------------------------

  if (typedConfig.impact !== undefined) {
    if (typeof typedConfig.impact !== "object" || typedConfig.impact === null) {
      throw new Error(
        '"impact" must be an object in asset-inspector.config.json',
      );
    }

    if (typedConfig.impact.weights !== undefined) {
      if (
        typeof typedConfig.impact.weights !== "object" ||
        typedConfig.impact.weights === null
      ) {
        throw new Error(
          '"impact.weights" must be an object in asset-inspector.config.json',
        );
      }

      const weights = typedConfig.impact.weights;

      validatePositiveNumber(weights.unused, "impact.weights.unused");

      validatePositiveNumber(weights.duplicate, "impact.weights.duplicate");

      validatePositiveNumber(
        weights.typeMismatch,
        "impact.weights.typeMismatch",
      );

      if (weights.optimization !== undefined) {
        if (
          typeof weights.optimization !== "object" ||
          weights.optimization === null
        ) {
          throw new Error(
            '"impact.weights.optimization" must be an object in asset-inspector.config.json',
          );
        }

        validatePositiveNumber(
          weights.optimization.low,
          "impact.weights.optimization.low",
        );

        validatePositiveNumber(
          weights.optimization.high,
          "impact.weights.optimization.high",
        );
      }
    }
  }

  // --------------------------------
  // BUILD VALIDATED CONFIG
  // --------------------------------

  const result: AssetInspectorConfig = {};

  // --------------------------------
  // ASSETS
  // --------------------------------

  if (typedConfig.assets) {
    const assetsConfig: NonNullable<AssetInspectorConfig["assets"]> = {};

    if (Array.isArray(typedConfig.assets.ignore)) {
      assetsConfig.ignore = typedConfig.assets.ignore.filter(
        (value): value is string => typeof value === "string",
      );
    }

    if (Array.isArray(typedConfig.assets.extensions)) {
      assetsConfig.extensions = typedConfig.assets.extensions.filter(
        (value): value is string => typeof value === "string",
      );
    }

    result.assets = assetsConfig;
  }

  // --------------------------------
  // OPTIMIZATION
  // --------------------------------

  if (typedConfig.optimization) {
    const optimizationConfig: NonNullable<
      AssetInspectorConfig["optimization"]
    > = {};

    const maxFileSize = validatePositiveNumber(
      typedConfig.optimization.maxFileSize,
      "optimization.maxFileSize",
    );

    const maxWidth = validatePositiveNumber(
      typedConfig.optimization.maxWidth,
      "optimization.maxWidth",
    );

    const maxHeight = validatePositiveNumber(
      typedConfig.optimization.maxHeight,
      "optimization.maxHeight",
    );

    const highSeverityScore = validatePositiveNumber(
      typedConfig.optimization.highSeverityScore,
      "optimization.highSeverityScore",
    );

    if (maxFileSize !== undefined) {
      optimizationConfig.maxFileSize = maxFileSize;
    }

    if (maxWidth !== undefined) {
      optimizationConfig.maxWidth = maxWidth;
    }

    if (maxHeight !== undefined) {
      optimizationConfig.maxHeight = maxHeight;
    }

    if (highSeverityScore !== undefined) {
      optimizationConfig.highSeverityScore = highSeverityScore;
    }

    result.optimization = optimizationConfig;
  }

  // --------------------------------
  // IMPACT
  // --------------------------------

  if (typedConfig.impact?.weights) {
    const rawWeights = typedConfig.impact.weights;

    const impactWeights: NonNullable<
      NonNullable<AssetInspectorConfig["impact"]>["weights"]
    > = {};

    const unused = validatePositiveNumber(
      rawWeights.unused,
      "impact.weights.unused",
    );

    const duplicate = validatePositiveNumber(
      rawWeights.duplicate,
      "impact.weights.duplicate",
    );

    const typeMismatch = validatePositiveNumber(
      rawWeights.typeMismatch,
      "impact.weights.typeMismatch",
    );

    if (unused !== undefined) {
      impactWeights.unused = unused;
    }

    if (duplicate !== undefined) {
      impactWeights.duplicate = duplicate;
    }

    if (typeMismatch !== undefined) {
      impactWeights.typeMismatch = typeMismatch;
    }

    if (rawWeights.optimization) {
      const optimizationWeights: NonNullable<
        NonNullable<
          NonNullable<AssetInspectorConfig["impact"]>["weights"]
        >["optimization"]
      > = {};

      const low = validatePositiveNumber(
        rawWeights.optimization.low,
        "impact.weights.optimization.low",
      );

      const high = validatePositiveNumber(
        rawWeights.optimization.high,
        "impact.weights.optimization.high",
      );

      if (low !== undefined) {
        optimizationWeights.low = low;
      }

      if (high !== undefined) {
        optimizationWeights.high = high;
      }

      impactWeights.optimization = optimizationWeights;
    }

    result.impact = {
      weights: impactWeights,
    };
  }

  return result;
}
