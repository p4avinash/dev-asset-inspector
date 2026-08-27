export type ImpactPriority = "low" | "medium" | "high" | "critical";

export type AssetInfo = {
  id?: string;
  name: string;
  path: string;
  type?: string;
  extension: string;
  size: number;
  mimeType: string;
  typeMismatch: boolean;
  hash?: string;

  detectedExtension?: string;
  detectedMimeType?: string;

  width?: number;
  height?: number;
};

export type DuplicateGroup = {
  hash: string;
  assets: AssetInfo[];
  canonicalAsset: AssetInfo;
  totalSize: number;
  wastedSize: number;
};

export type OptimizationSeverity = "low" | "high";

export type OptimizationResult = {
  asset: AssetInfo;
  isCandidate: boolean;
  score: number;
  reasons: string[];
  severity?: OptimizationSeverity;
};

export type AssetUsageStatus = "USED" | "NOT_REFERENCED";

export type AssetUsageResult = {
  asset: AssetInfo;
  status: AssetUsageStatus;
  referencedIn: string[];
  referenceCount: number;
};

export type ImpactResult = {
  asset: AssetInfo;
  score: number;
  priority: ImpactPriority;
  reasons: string[];
};

export type AssetInspectionSummary = {
  totalAssets: number;
  usedAssets: number;
  unusedAssets: number;
  duplicateGroups: number;
  wastedBytes: number;
  optimizationCandidates: number;
  highSeverityCandidates: number;
  typeMismatches: number;

  topIssues?: string[];
  highestImpactAssets?: {
    asset: AssetInfo;
    score: number;
    priority: ImpactPriority;
  }[];
};

export type AssetInspectionReport = {
  assets: AssetInfo[];
  duplicates: DuplicateGroup[];
  duplicateGroups?: DuplicateGroup[];
  optimization: OptimizationResult[];
  usage: AssetUsageResult[];
  impact: ImpactResult[];
  summary: AssetInspectionSummary;
};
