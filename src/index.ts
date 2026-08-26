import fs from "node:fs";

import { analyzeProject } from "./analyzer/analyzeProject.js";
import { formatAssetInspectionReport } from "./report/reportFormatter.js";
import { formatAssetInspectionReportAsJson } from "./report/reportJsonFormatter.js";
import { parseArguments, printHelp } from "./cli/argumentParser.js";

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

const report = await analyzeProject(projectRoot);

if (json) {
  console.log(formatAssetInspectionReportAsJson(report));
} else {
  console.log(formatAssetInspectionReport(report));
}
