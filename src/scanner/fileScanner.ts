import fs from "node:fs";
import path from "node:path";
import { fileTypeFromFile } from "file-type";
import { getImageDimensions } from "../metadata/imageMetadata.js";
import { getFileHash } from "../utils/fileHash.js";
import {
  shouldIgnore,
  shouldIgnoreDirectory,
} from "../config/ignoreMatcher.js";

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
]);

const DEFAULT_ASSET_EXTENSIONS = new Set([
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
  ".ico": "image/x-icon",
};

export type AssetInfo = {
  id?: string;
  name: string;
  path: string;
  type?: string;
  extension: string;
  detectedExtension?: string;
  size: number;
  mimeType: string;
  detectedMimeType?: string;
  typeMismatch: boolean;
  hash?: string;
  width?: number;
  height?: number;
};

function normalizeExtensions(additionalExtensions: string[]): Set<string> {
  return new Set(
    additionalExtensions.map((extension) => {
      const normalizedExtension = extension.trim().toLowerCase();

      return normalizedExtension.startsWith(".")
        ? normalizedExtension
        : `.${normalizedExtension}`;
    }),
  );
}

export async function scanFiles(
  projectRoot: string,
  ignorePatterns: string[] = [],
  scanRoot: string = projectRoot,
  additionalExtensions: string[] = [],
): Promise<AssetInfo[]> {
  const assets: AssetInfo[] = [];

  const customExtensions = normalizeExtensions(additionalExtensions);

  const assetExtensions = new Set([
    ...DEFAULT_ASSET_EXTENSIONS,
    ...customExtensions,
  ]);

  const entries = fs.readdirSync(projectRoot, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(projectRoot, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      if (shouldIgnoreDirectory(fullPath, scanRoot, ignorePatterns)) {
        continue;
      }

      const childAssets = await scanFiles(
        fullPath,
        ignorePatterns,
        scanRoot,
        additionalExtensions,
      );

      assets.push(...childAssets);
    } else if (entry.isFile()) {
      if (shouldIgnore(fullPath, scanRoot, ignorePatterns)) {
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();

      if (!assetExtensions.has(extension)) {
        continue;
      }

      const stats = fs.statSync(fullPath);

      const mimeType = MIME_TYPES[extension];

      if (!mimeType) {
        continue;
      }

      const detectedType = await fileTypeFromFile(fullPath);

      const dimensions = await getImageDimensions(fullPath);

      const hash = await getFileHash(fullPath);

      const asset: AssetInfo = {
        id: fullPath,
        name: entry.name,
        path: fullPath,
        type: extension.replace(".", "").toLowerCase(),
        extension,
        size: stats.size,
        mimeType,
        typeMismatch: false,
        hash,
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
