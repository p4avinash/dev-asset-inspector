import fs from "node:fs";
import path from "node:path";
import type { AssetInfo } from "../scanner/fileScanner.js";

const SOURCE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".css",
  ".scss",
  ".sass",
  ".html",
]);

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
]);

export type AssetUsageStatus = "USED" | "NOT_REFERENCED";

export type AssetUsageResult = {
  asset: AssetInfo;
  status: AssetUsageStatus;
  referencedIn: string[];
  referenceCount: number;
};

function collectSourceFiles(projectRoot: string): string[] {
  const sourceFiles: string[] = [];

  const entries = fs.readdirSync(projectRoot, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(projectRoot, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      sourceFiles.push(...collectSourceFiles(fullPath));

      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (SOURCE_EXTENSIONS.has(extension)) {
      sourceFiles.push(fullPath);
    }
  }

  return sourceFiles;
}

function normalizeReference(reference: string): string {
  const cleanedReference = reference.trim().replace(/^["']|["']$/g, "");

  const queryIndex = cleanedReference.indexOf("?");

  const withoutQuery =
    queryIndex === -1
      ? cleanedReference
      : cleanedReference.slice(0, queryIndex);

  const hashIndex = withoutQuery.indexOf("#");

  const withoutHash =
    hashIndex === -1 ? withoutQuery : withoutQuery.slice(0, hashIndex);

  return withoutHash;
}

function extractReferences(content: string): string[] {
  const references: string[] = [];

  // --------------------------------
  // JS / TS imports and require()
  // --------------------------------

  const importRegex =
    /(?:import\s+(?:[\s\S]*?\s+from\s+)?|require\s*\(\s*)["']([^"']+)["']/g;

  for (const match of content.matchAll(importRegex)) {
    const reference = match[1];

    if (reference) {
      references.push(normalizeReference(reference));
    }
  }

  // --------------------------------
  // HTML src / href
  // --------------------------------

  const htmlRegex = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;

  for (const match of content.matchAll(htmlRegex)) {
    const reference = match[1];

    if (reference) {
      references.push(normalizeReference(reference));
    }
  }

  // --------------------------------
  // CSS / SCSS / SASS url(...)
  // --------------------------------

  const cssUrlRegex = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;

  for (const match of content.matchAll(cssUrlRegex)) {
    const reference = match[1];

    if (reference) {
      references.push(normalizeReference(reference));
    }
  }

  return references;
}

function resolveReference(
  reference: string,
  sourceFile: string,
  projectRoot: string,
): string | null {
  // External URLs and data URLs
  if (
    reference.startsWith("http://") ||
    reference.startsWith("https://") ||
    reference.startsWith("//") ||
    reference.startsWith("data:")
  ) {
    return null;
  }

  // Ignore package imports such as:
  // react
  // react-dom
  // lodash
  if (!reference.startsWith(".") && !reference.startsWith("/")) {
    return null;
  }

  const sourceDirectory = path.dirname(sourceFile);

  // --------------------------------
  // Absolute project references
  // Example:
  // /assets/logo.png
  // --------------------------------

  if (reference.startsWith("/")) {
    return path.normalize(path.join(projectRoot, reference.slice(1)));
  }

  // --------------------------------
  // Relative references
  // Example:
  // ./assets/logo.png
  // ../assets/logo.png
  // --------------------------------

  return path.normalize(path.resolve(sourceDirectory, reference));
}

export function analyzeAssetUsage(
  projectRoot: string,
  assets: AssetInfo[],
): AssetUsageResult[] {
  const sourceFiles = collectSourceFiles(projectRoot);

  const references = new Map<string, Set<string>>();

  // Create an empty reference set
  // for every discovered asset.
  for (const asset of assets) {
    references.set(path.normalize(asset.path), new Set());
  }

  // --------------------------------
  // Scan every source file
  // --------------------------------

  for (const sourceFile of sourceFiles) {
    const content = fs.readFileSync(sourceFile, "utf-8");

    const extractedReferences = extractReferences(content);

    for (const reference of extractedReferences) {
      const resolvedPath = resolveReference(reference, sourceFile, projectRoot);

      if (!resolvedPath) {
        continue;
      }

      const normalizedResolvedPath = path.normalize(resolvedPath);

      // --------------------------------
      // Match reference against assets
      // --------------------------------

      for (const asset of assets) {
        const normalizedAssetPath = path.normalize(asset.path);

        if (normalizedResolvedPath !== normalizedAssetPath) {
          continue;
        }

        const relativeSourcePath = path
          .relative(projectRoot, sourceFile)
          .replaceAll("\\", "/");

        references.get(normalizedAssetPath)?.add(relativeSourcePath);
      }
    }
  }

  // --------------------------------
  // Build final result
  // --------------------------------

  return assets.map((asset) => {
    const normalizedAssetPath = path.normalize(asset.path);

    const referencedIn = Array.from(
      references.get(normalizedAssetPath) ?? new Set<string>(),
    );

    return {
      asset,
      status: referencedIn.length > 0 ? "USED" : "NOT_REFERENCED",
      referencedIn,
      referenceCount: referencedIn.length,
    };
  });
}
