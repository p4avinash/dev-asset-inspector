import type { AssetInfo } from "../scanner/fileScanner.js";

export type DuplicateGroup = {
  hash: string;
  assets: AssetInfo[];
  canonicalAsset: AssetInfo;
  totalSize: number;
  wastedSize: number;
};

function selectCanonicalAsset(assets: AssetInfo[]): AssetInfo | undefined {
  return [...assets].sort((a, b) => {
    const aMismatchScore = a.typeMismatch ? 1 : 0;
    const bMismatchScore = b.typeMismatch ? 1 : 0;

    if (aMismatchScore !== bMismatchScore) {
      return aMismatchScore - bMismatchScore;
    }

    return a.name.localeCompare(b.name);
  })[0];
}

export function findDuplicates(assets: AssetInfo[]): DuplicateGroup[] {
  const groups = new Map<string, AssetInfo[]>();

  for (const asset of assets) {
    if (!asset.hash) {
      continue;
    }

    const existingGroup = groups.get(asset.hash);

    if (existingGroup) {
      existingGroup.push(asset);
    } else {
      groups.set(asset.hash, [asset]);
    }
  }

  const duplicateGroups: DuplicateGroup[] = [];

  for (const [hash, groupedAssets] of groups) {
    if (groupedAssets.length < 2) {
      continue;
    }

    const canonicalAsset = selectCanonicalAsset(groupedAssets);

    if (!canonicalAsset) {
      continue;
    }

    const totalSize = groupedAssets.reduce(
      (total, asset) => total + asset.size,
      0,
    );

    const wastedSize = totalSize - canonicalAsset.size;

    duplicateGroups.push({
      hash,
      assets: groupedAssets,
      canonicalAsset,
      totalSize,
      wastedSize,
    });
  }

  return duplicateGroups;
}
