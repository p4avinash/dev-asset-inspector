import type { AssetInspectionReport } from "./reportGenerator.js";

export function formatAssetInspectionReport(
  report: AssetInspectionReport,
): string {
  const lines: string[] = [];

  // --------------------------------
  // SUMMARY
  // --------------------------------

  lines.push("ASSET INSPECTION SUMMARY:");
  lines.push(`Total assets: ${report.summary.totalAssets}`);
  lines.push(`Used assets: ${report.summary.usedAssets}`);
  lines.push(`Unused assets: ${report.summary.unusedAssets}`);
  lines.push(`Duplicate groups: ${report.summary.duplicateGroups}`);
  lines.push(`Potentially wasted: ${report.summary.wastedBytes} bytes`);
  lines.push(
    `Optimization candidates: ${report.summary.optimizationCandidates}`,
  );
  lines.push(
    `High severity candidates: ${report.summary.highSeverityCandidates}`,
  );
  lines.push(`Type mismatches: ${report.summary.typeMismatches}`);

  // --------------------------------
  // DUPLICATES
  // --------------------------------

  lines.push("");
  lines.push("DUPLICATE GROUPS:");

  if (report.duplicates.length === 0) {
    lines.push("No duplicate assets found.");
  }

  for (const [index, group] of report.duplicates.entries()) {
    lines.push("");
    lines.push(`Group ${index + 1}`);
    lines.push(`Hash: ${group.hash}`);
    lines.push(`Canonical: ${group.canonicalAsset.name}`);
    lines.push(`Total size: ${group.totalSize} bytes`);
    lines.push(`Potentially wasted: ${group.wastedSize} bytes`);

    lines.push("Files:");

    for (const asset of group.assets) {
      lines.push(`- ${asset.name}`);
    }
  }

  // --------------------------------
  // OPTIMIZATION
  // --------------------------------

  lines.push("");
  lines.push("OPTIMIZATION CANDIDATES:");

  const optimizationCandidates = report.optimization.filter(
    (result) => result.isCandidate,
  );

  if (optimizationCandidates.length === 0) {
    lines.push("No optimization candidates found.");
  }

  for (const result of optimizationCandidates) {
    lines.push("");
    lines.push(`File: ${result.asset.name}`);
    lines.push(`Size: ${result.asset.size} bytes`);

    lines.push(
      `Dimensions: ${result.asset.width ?? "unknown"} × ${
        result.asset.height ?? "unknown"
      }`,
    );

    lines.push(`Score: ${result.score}`);
    lines.push(`Severity: ${result.severity}`);

    lines.push("Reasons:");

    for (const reason of result.reasons) {
      lines.push(`- ${reason}`);
    }
  }

  // --------------------------------
  // USAGE
  // --------------------------------

  lines.push("");
  lines.push("ASSET USAGE:");

  for (const result of report.usage) {
    lines.push(`- ${result.asset.name}: ${result.status}`);

    lines.push(`  Reference count: ${result.referenceCount}`);

    if (result.referencedIn.length > 0) {
      lines.push("  Referenced in:");

      for (const sourceFile of result.referencedIn) {
        lines.push("  - " + sourceFile);
      }
    }
  }

  // --------------------------------
  // IMPACT
  // --------------------------------

  lines.push("");
  lines.push("ASSET IMPACT:");

  const impactResults = [...report.impact].sort((a, b) => b.score - a.score);

  if (impactResults.length === 0) {
    lines.push("No impact results found.");
  }

  for (const result of impactResults) {
    lines.push("");
    lines.push(`File: ${result.asset.name}`);
    lines.push(`Score: ${result.score}`);
    lines.push(`Priority: ${result.priority}`);

    if (result.reasons.length > 0) {
      lines.push("Reasons:");

      for (const reason of result.reasons) {
        lines.push(`- ${reason}`);
      }
    }
  }

  return lines.join("\n");
}
