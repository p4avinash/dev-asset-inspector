import fs from "node:fs";
import path from "node:path";
import { fileTypeFromFile } from "file-type";
import { getImageDimensions } from "../metadata/imageMetadata.js";

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

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

type AssetInfo = {
  name: string;
  path: string;
  extension: string;
  detectedExtension?: string;
  size: number;
  mimeType: string;
  detectedMimeType?: string;
  typeMismatch: boolean;
  width?: number;
  height?: number;
};

export async function scanFiles(projectRoot: string): Promise<AssetInfo[]> {
  const assets: AssetInfo[] = [];
  const entries = fs.readdirSync(projectRoot, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(projectRoot, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const childAssets = await scanFiles(fullPath);

      assets.push(...childAssets);
    } else if (entry.isFile()) {
      const extension = path.extname(entry.name).toLowerCase();

      if (!ASSET_EXTENSIONS.has(extension)) {
        continue;
      }

      const stats = fs.statSync(fullPath);

      const mimeType = MIME_TYPES[extension];

      if (!mimeType) {
        continue;
      }

      const detectedType = await fileTypeFromFile(fullPath);

      const dimensions = await getImageDimensions(fullPath);

      const asset: AssetInfo = {
        name: entry.name,
        path: fullPath,
        extension,
        size: stats.size,
        mimeType,
        typeMismatch: false,
      };

      if (detectedType) {
        asset.detectedExtension = `.${detectedType.ext}`;
        asset.detectedMimeType = detectedType.mime;

        asset.typeMismatch = asset.detectedExtension !== asset.extension;
      }

      if (dimensions) {
        asset.width = dimensions.width;
        asset.height = dimensions.height;
      }

      assets.push(asset);
    }
  }

  return assets;
}
