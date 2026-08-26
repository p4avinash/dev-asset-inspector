import fs from "node:fs";

import { scanFiles } from "./scanner/fileScanner.js";
import { findDuplicates } from "./analysis/duplicateDetector.js";
import { analyzeOptimization } from "./analysis/optimizationAnalyzer.js";
import { analyzeAssetUsage } from "./analysis/usageAnalyzer.js";
import { createAssetInspectionReport } from "./report/reportGenerator.js";
import { formatAssetInspectionReport } from "./report/reportFormatter.js";
import { parseArguments, printHelp } from "./cli/argumentParser.js";
import { formatAssetInspectionReportAsJson } from "./report/reportJsonFormatter.js";
import { loadConfig } from "./config/configLoader.js";

const parseResult = parseArguments(process.argv.slice(2));

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

const config = loadConfig(projectRoot);

// --------------------------------
// ANALYSIS
// --------------------------------

const assets = await scanFiles(
  projectRoot,
  config.assets?.ignore ?? [],
  projectRoot,
  config.assets?.extensions ?? [],
);

const duplicateGroups = findDuplicates(assets);

const optimizationResults = analyzeOptimization(assets);

const usageResults = analyzeAssetUsage(projectRoot, assets);

// --------------------------------
// REPORT
// --------------------------------

const report = createAssetInspectionReport(
  assets,
  duplicateGroups,
  optimizationResults,
  usageResults,
);

// --------------------------------
// CLI OUTPUT
// --------------------------------

if (json) {
  console.log(formatAssetInspectionReportAsJson(report));
} else {
  console.log(formatAssetInspectionReport(report));
}
