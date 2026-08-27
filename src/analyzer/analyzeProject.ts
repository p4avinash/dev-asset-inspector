import path from "node:path";
import { scanFiles } from "../scanner/fileScanner.js";
import { findDuplicates } from "../analysis/duplicateDetector.js";
import { analyzeOptimization } from "../analysis/optimizationAnalyzer.js";
import { analyzeAssetUsage } from "../analysis/usageAnalyzer.js";
import { analyzeImpact } from "../analysis/impactAnalyzer.js";
import { createAssetInspectionReport } from "../report/reportGenerator.js";
import { loadConfig } from "../config/configLoader.js";
import type { AssetInspectionReport } from "../report/reportGenerator.js";

function toRelativePath(filePath: string, root: string): string {
  if (!path.isAbsolute(filePath)) {
    return filePath.replaceAll("\\", "/");
  }
  return path.relative(root, filePath).replaceAll("\\", "/");
}

function normalizeReportPaths(
  report: AssetInspectionReport,
  projectRoot: string,
): AssetInspectionReport {
  for (const asset of report.assets) {
    asset.path = toRelativePath(asset.path, projectRoot);
    asset.id = asset.path;
  }

  for (const group of report.duplicates) {
    group.canonicalAsset.path = toRelativePath(
      group.canonicalAsset.path,
      projectRoot,
    );
    group.canonicalAsset.id = group.canonicalAsset.path;
    for (const asset of group.assets) {
      asset.path = toRelativePath(asset.path, projectRoot);
      asset.id = asset.path;
    }
  }

  for (const opt of report.optimization) {
    opt.asset.path = toRelativePath(opt.asset.path, projectRoot);
  }

  for (const use of report.usage) {
    use.asset.path = toRelativePath(use.asset.path, projectRoot);
  }

  for (const imp of report.impact) {
    imp.asset.path = toRelativePath(imp.asset.path, projectRoot);
  }

  for (const item of report.summary.highestImpactAssets) {
    item.asset.path = toRelativePath(item.asset.path, projectRoot);
  }

  return report;
}

export async function analyzeProject(
  projectRoot: string,
): Promise<AssetInspectionReport> {
  const config = loadConfig(projectRoot);

  const assets = await scanFiles(
    projectRoot,
    config.assets?.ignore ?? [],
    projectRoot,
    config.assets?.extensions ?? [],
  );

  const duplicateGroups = findDuplicates(assets);

  const optimizationResults = analyzeOptimization(assets, config.optimization);

  const usageResults = analyzeAssetUsage(projectRoot, assets);

  const impactResults = analyzeImpact(
    assets,
    duplicateGroups,
    optimizationResults,
    usageResults,
    config.impact?.weights
      ? {
          weights: config.impact.weights,
        }
      : {},
  );

  const report = createAssetInspectionReport(
    assets,
    duplicateGroups,
    optimizationResults,
    usageResults,
    impactResults,
  );

  return normalizeReportPaths(report, projectRoot);
}

