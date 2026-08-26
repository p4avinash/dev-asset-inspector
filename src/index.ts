import { scanFiles } from "./scanner/fileScanner.js";
import { findDuplicates } from "./analysis/duplicateDetector.js";
import { analyzeOptimization } from "./analysis/optimizationAnalyzer.js";
import { analyzeAssetUsage } from "./analysis/usageAnalyzer.js";

const projectRoot = "C:\\Study\\NPM\\asset-inspector-consumer";

const assets = await scanFiles(projectRoot);

console.log("FOUND ASSETS:", assets);

// -------------------------
// DUPLICATE ANALYSIS
// -------------------------

const duplicateGroups = findDuplicates(assets);

console.log("\nDUPLICATE GROUPS:");

for (const [index, group] of duplicateGroups.entries()) {
  console.log(`\nGroup ${index + 1}`);
  console.log("Hash:", group.hash);
  console.log("Canonical:", group.canonicalAsset.name);
  console.log("Total size:", group.totalSize, "bytes");
  console.log("Potentially wasted:", group.wastedSize, "bytes");

  console.log("Files:");

  for (const asset of group.assets) {
    console.log(`- ${asset.name}`);
  }
}

// -------------------------
// OPTIMIZATION ANALYSIS
// -------------------------

const optimizationResults = analyzeOptimization(assets);

console.log("\nOPTIMIZATION CANDIDATES:");

for (const result of optimizationResults) {
  if (!result.isCandidate) {
    continue;
  }

  console.log(`\nFile: ${result.asset.name}`);
  console.log("Size:", result.asset.size, "bytes");
  console.log(
    "Dimensions:",
    `${result.asset.width ?? "unknown"} × ${result.asset.height ?? "unknown"}`,
  );
  console.log("Score:", result.score);
  console.log("Severity:", result.severity);
  console.log("Reasons:");

  for (const reason of result.reasons) {
    console.log(`- ${reason}`);
  }
}

// -------------------------
// ASSET USAGE ANALYSIS
// -------------------------

const usageResults = analyzeAssetUsage(projectRoot, assets);

console.log("\nASSET USAGE:");

for (const result of usageResults) {
  console.log(`\n- ${result.asset.name}: ${result.isUsed ? "USED" : "UNUSED"}`);

  if (result.isUsed) {
    console.log("  Referenced in:");

    for (const sourceFile of result.referencedIn) {
      console.log(`  - ${sourceFile}`);
    }
  }
}
