import { useMemo, useState } from "react";
import type { AssetInfo, AssetUsageResult } from "../../types/assetReport";

type AssetsTabProps = {
  assets: AssetInfo[];
  usage: AssetUsageResult[];
};

type AssetFilter = "all" | "used" | "unused" | "mismatch";

export function AssetsTab({ assets, usage }: AssetsTabProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AssetFilter>("all");

  const usageMap = useMemo(() => {
    return new Map(usage.map((item) => [item.asset.path, item]));
  }, [usage]);

  const filteredAssets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const usageInfo = usageMap.get(asset.path);

      const matchesSearch =
        !normalizedSearch ||
        asset.name.toLowerCase().includes(normalizedSearch) ||
        asset.path.toLowerCase().includes(normalizedSearch);

      const matchesFilter =
        filter === "all" ||
        (filter === "used" && usageInfo?.status === "USED") ||
        (filter === "unused" && usageInfo?.status === "NOT_REFERENCED") ||
        (filter === "mismatch" && asset.typeMismatch);

      return matchesSearch && matchesFilter;
    });
  }, [assets, filter, search, usageMap]);

  return (
    <div className="inspector-assets">
      <div className="inspector-assets__header">
        <div>
          <span className="inspector-eyebrow">ASSET INVENTORY</span>

          <h3>Assets</h3>

          <p>Browse and inspect assets detected in your project.</p>
        </div>

        <span className="inspector-assets__count">{filteredAssets.length}</span>
      </div>

      <div className="inspector-assets__toolbar">
        <label className="inspector-search">
          <span className="inspector-search__icon" aria-hidden="true">
            ⌕
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search assets..."
            aria-label="Search assets"
          />

          {search && (
            <button
              type="button"
              className="inspector-search__clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </label>

        <div
          className="inspector-filter-group"
          role="group"
          aria-label="Asset filters"
        >
          {(
            [
              ["all", "All"],
              ["used", "Used"],
              ["unused", "Unused"],
              ["mismatch", "Mismatch"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={
                filter === value
                  ? "inspector-filter inspector-filter--active"
                  : "inspector-filter"
              }
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="inspector-assets__empty">
          <span className="inspector-assets__empty-icon">◫</span>

          <h4>
            {assets.length === 0 ? "No assets available" : "No matching assets"}
          </h4>

          <p>
            {assets.length === 0
              ? "Asset information will appear here once the project is analyzed."
              : "Try changing your search or filter."}
          </p>

          {assets.length > 0 && (
            <button
              type="button"
              className="inspector-assets__reset"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="inspector-asset-list">
          {filteredAssets.map((asset) => {
            const usageInfo = usageMap.get(asset.path);

            const isUsed = usageInfo?.status === "USED";
            const referenceCount = usageInfo?.referenceCount ?? 0;

            return (
              <article
                key={`${asset.path}-${asset.hash}`}
                className="inspector-asset-row"
              >
                <div className="inspector-asset-row__icon">
                  {asset.extension.toUpperCase()}
                </div>

                <div className="inspector-asset-row__content">
                  <div className="inspector-asset-row__name">
                    <strong>{asset.name}</strong>

                    {asset.typeMismatch && (
                      <span className="inspector-asset-row__mismatch-dot">
                        !
                      </span>
                    )}
                  </div>

                  <span className="inspector-asset-row__path">
                    {asset.path}
                  </span>

                  {asset.typeMismatch && (
                    <span className="inspector-asset-row__warning">
                      Expected {asset.extension.toUpperCase()} → Detected{" "}
                      {asset.detectedExtension?.toUpperCase() ?? "unknown"}
                    </span>
                  )}
                </div>

                <div className="inspector-asset-row__meta">
                  <span>{formatBytes(asset.size)}</span>

                  {asset.width !== undefined && asset.height !== undefined && (
                    <span>
                      {asset.width} × {asset.height}
                    </span>
                  )}

                  <span>
                    {referenceCount}{" "}
                    {referenceCount === 1 ? "reference" : "references"}
                  </span>
                </div>

                <div className="inspector-asset-row__status">
                  {asset.typeMismatch ? (
                    <span className="inspector-status inspector-status--warning">
                      Mismatch
                    </span>
                  ) : (
                    <span
                      className={
                        isUsed
                          ? "inspector-status inspector-status--success"
                          : "inspector-status"
                      }
                    >
                      {isUsed ? "Used" : "Unused"}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
