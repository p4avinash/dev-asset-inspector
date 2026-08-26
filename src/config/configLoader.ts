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
  };
};

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

  const typedConfig = config as {
    assets?: {
      ignore?: unknown;
      extensions?: unknown;
    };
  };

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

  return config as AssetInspectorConfig;
}
