import fs from "node:fs";
import path from "node:path";

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
]);

const ASSET_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
  ".avif",
]);

type AssetInfo = {
  name: string;
  path: string;
  extension: string;
};

export function scanFiles(projectRoot: string): AssetInfo[] {
  const assets: AssetInfo[] = [];
  const entries = fs.readdirSync(projectRoot, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(projectRoot, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const childAssets = scanFiles(fullPath);

      assets.push(...childAssets);
      //   scanFiles(fullPath);
    } else if (entry.isFile()) {
      const extension = path.extname(entry.name).toLowerCase();

      if (ASSET_EXTENSIONS.has(extension)) {
        assets.push({
          name: entry.name,
          path: fullPath,
          extension,
        });
      }
    }
  }

  return assets;
}
