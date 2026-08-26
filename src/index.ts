import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { analyzeProject } from "./analyzer/analyzeProject.js";
import { formatAssetInspectionReport } from "./report/reportFormatter.js";
import { formatAssetInspectionReportAsJson } from "./report/reportJsonFormatter.js";
import { parseArguments, printHelp } from "./cli/argumentParser.js";

// Re-export core programmatic APIs
export { analyzeProject } from "./analyzer/analyzeProject.js";
export { scanFiles } from "./scanner/fileScanner.js";
export { loadConfig } from "./config/configLoader.js";
export { formatAssetInspectionReport } from "./report/reportFormatter.js";
export { formatAssetInspectionReportAsJson } from "./report/reportJsonFormatter.js";
export type {
  AssetInspectionReport,
  AssetInspectionSummary,
} from "./report/reportGenerator.js";
export type { AssetInfo } from "./scanner/fileScanner.js";
export type { DuplicateGroup } from "./analysis/duplicateDetector.js";
export type { OptimizationResult } from "./analysis/optimizationAnalyzer.js";
export type { AssetUsageResult } from "./analysis/usageAnalyzer.js";
export type { ImpactResult } from "./analysis/impactAnalyzer.js";
export type { AssetInspectorConfig } from "./config/configLoader.js";

export async function runCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  const parseResult = parseArguments(argv);

  if (!parseResult.success) {
    console.error(parseResult.error);
    console.error('Run "asset-inspector --help" for usage.');
    process.exit(1);
  }

  const { projectRoot, json, help } = parseResult.options;

  if (help) {
    printHelp();
    process.exit(0);
  }

  if (!projectRoot) {
    console.error("Please provide a project path.");
    process.exit(1);
  }

  if (!fs.existsSync(projectRoot)) {
    console.error(`Project path does not exist: ${projectRoot}`);
    process.exit(1);
  }

  if (!fs.statSync(projectRoot).isDirectory()) {
    console.error(`Project path is not a directory: ${projectRoot}`);
    process.exit(1);
  }

  const report = await analyzeProject(projectRoot);

  if (json) {
    console.log(formatAssetInspectionReportAsJson(report));
  } else {
    console.log(formatAssetInspectionReport(report));
  }
}

function shouldRunCli(): boolean {
  if (!process.argv || !process.argv[1]) {
    return false;
  }

  try {
    const currentScript = fileURLToPath(import.meta.url);
    const invokedScript = path.resolve(process.argv[1]);

    if (currentScript === invokedScript) {
      return true;
    }
  } catch {
    // Ignore resolution errors
  }

  const invokedLower = process.argv[1].toLowerCase();
  return (
    invokedLower.endsWith("index.js") ||
    invokedLower.endsWith("index.ts") ||
    invokedLower.includes("asset-inspector") ||
    invokedLower.includes("dev-asset-inspector")
  );
}

if (shouldRunCli()) {
  await runCli();
}
