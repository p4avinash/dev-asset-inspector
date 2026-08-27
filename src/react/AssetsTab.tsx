import { useMemo, useState } from "react";
import type {
  AssetInfo,
  AssetUsageResult,
  DuplicateGroup,
} from "./types.js";

type AssetsTabProps = {
  assets: AssetInfo[];
  usage: AssetUsageResult[];
  duplicates?: DuplicateGroup[];
};

type AssetFilter = "all" | "images" | "svg" | "duplicates" | "large";

const LARGE_FILE_THRESHOLD = 1_048_576; // 1 MB (PRD Section 4)

function toIdentifier(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, "");
  const cleaned = base
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");

  if (!cleaned) return "asset";
  if (/^[0-9]/.test(cleaned)) return `asset${cleaned}`;
  return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
}

function getImportStatement(asset: AssetInfo): string {
  const identifier = toIdentifier(asset.name);
  let importPath = asset.path;

  if (importPath.startsWith("src/")) {
    importPath = "./" + importPath.slice(4);
  } else if (!importPath.startsWith("./") && !importPath.startsWith("/")) {
    importPath = "./" + importPath;
  }

  return `import ${identifier} from "${importPath}";`;
}

function getJsxSnippet(asset: AssetInfo): string {
  const identifier = toIdentifier(asset.name);
  const alt = asset.name.replace(/\.[^/.]+$/, "");
  return `<img src={${identifier}} alt="${alt}" />`;
}

export function AssetsTab({
  assets,
  usage,
  duplicates = [],
}: AssetsTabProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    try {
      const saved = localStorage.getItem("dev-asset-inspector-view-mode");
      if (saved === "list" || saved === "grid") return saved;
    } catch {}
    return "list";
  });
  const [expandedPreviews, setExpandedPreviews] = useState<Set<string>>(
    new Set(),
  );
  const [toast, setToast] = useState<{
    message: string;
    isError?: boolean;
  } | null>(null);

  const switchViewMode = (mode: "list" | "grid") => {
    setViewMode(mode);
    try {
      localStorage.setItem("dev-asset-inspector-view-mode", mode);
    } catch {}
  };

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 2200);
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      showToast(successMessage);
    } catch {
      showToast("Unable to copy", true);
    }
  };

  const togglePreview = (id: string) => {
    setExpandedPreviews((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const duplicateHashSet = useMemo(() => {
    const set = new Set<string>();
    for (const group of duplicates) {
      set.add(group.hash);
    }
    return set;
  }, [duplicates]);

  const usageMap = useMemo(() => {
    return new Map(usage.map((item) => [item.asset.path, item]));
  }, [usage]);

  const filteredAssets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const isSvg = asset.extension.toLowerCase() === ".svg";
      const isLarge = asset.size > LARGE_FILE_THRESHOLD;
      const isDuplicate = asset.hash ? duplicateHashSet.has(asset.hash) : false;

      const matchesSearch =
        !normalizedSearch ||
        asset.name.toLowerCase().includes(normalizedSearch) ||
        asset.path.toLowerCase().includes(normalizedSearch) ||
        asset.extension.toLowerCase().includes(normalizedSearch);

      const matchesFilter =
        filter === "all" ||
        (filter === "images" && !isSvg) ||
        (filter === "svg" && isSvg) ||
        (filter === "duplicates" && isDuplicate) ||
        (filter === "large" && isLarge);

      return matchesSearch && matchesFilter;
    });
  }, [assets, duplicateHashSet, filter, search]);

  const headerTitle = useMemo(() => {
    switch (filter) {
      case "images":
        return `Images (${filteredAssets.length})`;
      case "svg":
        return `SVG Assets (${filteredAssets.length})`;
      case "duplicates":
        return `Duplicate Assets (${filteredAssets.length})`;
      case "large":
        return `Large Assets (${filteredAssets.length})`;
      case "all":
      default:
        return `All Assets (${filteredAssets.length})`;
    }
  }, [filter, filteredAssets.length]);

  return (
    <div className="inspector-assets">
      {toast && (
        <div
          className={`inspector-toast ${
            toast.isError ? "inspector-toast--error" : ""
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}

      <div className="inspector-assets__header">
        <div>
          <span className="inspector-eyebrow">ASSET INVENTORY</span>
          <h3>{headerTitle}</h3>
          <p>Browse, preview, and copy snippets for project assets.</p>
        </div>

        <span className="inspector-assets__count">
          {filteredAssets.length}
        </span>
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

        <div className="inspector-toolbar-row">
          <div
            className="inspector-filter-group"
            role="group"
            aria-label="Asset filters"
          >
            {(
              [
                ["all", "All"],
                ["images", "Images"],
                ["svg", "SVG"],
                ["duplicates", "Duplicates"],
                ["large", "Large"],
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

          <div
            className="inspector-view-toggle"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              className={`inspector-view-toggle__btn ${
                viewMode === "list"
                  ? "inspector-view-toggle__btn--active"
                  : ""
              }`}
              onClick={() => switchViewMode("list")}
              title="List View"
            >
              ☰ List
            </button>
            <button
              type="button"
              className={`inspector-view-toggle__btn ${
                viewMode === "grid"
                  ? "inspector-view-toggle__btn--active"
                  : ""
              }`}
              onClick={() => switchViewMode("grid")}
              title="Grid View"
            >
              ⊞ Grid
            </button>
          </div>
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="inspector-assets__empty">
          <span className="inspector-assets__empty-icon">◫</span>

          <h4>
            {assets.length === 0
              ? "No assets found"
              : "No assets match your search"}
          </h4>

          <p>
            {assets.length === 0
              ? "No asset files discovered in scanned project directories."
              : "Try adjusting your search query or switching active filters."}
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
      ) : viewMode === "grid" ? (
        <div className="inspector-asset-grid">
          {filteredAssets.map((asset) => {
            const isLarge = asset.size > LARGE_FILE_THRESHOLD;
            const isDuplicate = asset.hash
              ? duplicateHashSet.has(asset.hash)
              : false;
            const assetKey = asset.id || asset.path;

            return (
              <article key={assetKey} className="inspector-grid-card">
                <div className="inspector-grid-card__preview inspector-checkerboard">
                  <img
                    src={`/${asset.path.replace(/^\/+/, "")}`}
                    alt={asset.name}
                    className="inspector-grid-card__img"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget
                        .nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div
                    className="inspector-grid-card__fallback"
                    style={{ display: "none" }}
                  >
                    {asset.extension.replace(".", "").toUpperCase()}
                  </div>

                  <div className="inspector-grid-card__badges">
                    {isLarge && (
                      <span
                        className="inspector-badge inspector-badge--large"
                        title="File size exceeds 1 MB"
                      >
                        ⚠️ &gt; 1 MB
                      </span>
                    )}
                    {isDuplicate && (
                      <span
                        className="inspector-badge inspector-badge--duplicate"
                        title="Duplicate asset"
                      >
                        Duplicate
                      </span>
                    )}
                    {asset.typeMismatch && (
                      <span
                        className="inspector-badge"
                        style={{
                          background: "#fef3c7",
                          color: "#92400e",
                        }}
                        title="Extension mismatch"
                      >
                        Mismatch
                      </span>
                    )}
                  </div>
                </div>

                <div className="inspector-grid-card__body">
                  <div
                    className="inspector-grid-card__title"
                    title={asset.name}
                  >
                    <strong>{asset.name}</strong>
                    <span>{asset.path}</span>
                  </div>

                  <div className="inspector-grid-card__meta">
                    <span>{formatBytes(asset.size)}</span>
                    {asset.width && asset.height && (
                      <span>
                        {asset.width} × {asset.height}
                      </span>
                    )}
                  </div>

                  <div className="inspector-grid-card__actions">
                    <button
                      type="button"
                      className="inspector-action-btn"
                      onClick={() =>
                        copyToClipboard(
                          getImportStatement(asset),
                          "✓ Import copied",
                        )
                      }
                      title={`Copy import statement`}
                    >
                      Import
                    </button>
                    <button
                      type="button"
                      className="inspector-action-btn"
                      onClick={() =>
                        copyToClipboard(
                          getJsxSnippet(asset),
                          "✓ JSX copied",
                        )
                      }
                      title={`Copy JSX tag`}
                    >
                      JSX
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="inspector-asset-list">
          {filteredAssets.map((asset) => {
            const usageInfo = usageMap.get(asset.path);
            const isUsed = usageInfo?.status === "USED";
            const referenceCount = usageInfo?.referenceCount ?? 0;
            const isLarge = asset.size > LARGE_FILE_THRESHOLD;
            const isDuplicate = asset.hash
              ? duplicateHashSet.has(asset.hash)
              : false;
            const assetKey = asset.id || asset.path;
            const isPreviewOpen = expandedPreviews.has(assetKey);

            return (
              <article
                key={assetKey}
                className={`inspector-asset-row ${
                  isPreviewOpen ? "inspector-asset-row--expanded" : ""
                }`}
              >
                <div className="inspector-asset-row__main">
                  <div
                    className="inspector-asset-row__icon inspector-checkerboard"
                    title={asset.name}
                  >
                    <img
                      src={`/${asset.path.replace(/^\/+/, "")}`}
                      alt={asset.name}
                      className="inspector-asset-row__thumb"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget
                          .nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <span
                      className="inspector-asset-row__thumb-fallback"
                      style={{ display: "none" }}
                    >
                      {asset.extension.replace(".", "").toUpperCase()}
                    </span>
                  </div>

                  <div className="inspector-asset-row__content">
                    <div className="inspector-asset-row__name">
                      <strong>{asset.name}</strong>

                      {isLarge && (
                        <span
                          className="inspector-badge inspector-badge--large"
                          title="File size exceeds 1 MB"
                        >
                          ⚠️ &gt; 1 MB
                        </span>
                      )}

                      {isDuplicate && (
                        <span
                          className="inspector-badge inspector-badge--duplicate"
                          title="Exact content duplicate detected"
                        >
                          Duplicate
                        </span>
                      )}

                      {asset.typeMismatch && (
                        <span
                          className="inspector-asset-row__mismatch-dot"
                          title="File extension does not match MIME type"
                        >
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

                    {/* Card action buttons per F4, F7, F8, F9 */}
                    <div className="inspector-asset-actions">
                      <button
                        type="button"
                        className={`inspector-action-btn ${
                          isPreviewOpen ? "inspector-action-btn--active" : ""
                        }`}
                        onClick={() => togglePreview(assetKey)}
                        title="Toggle inline preview"
                      >
                        {isPreviewOpen ? "Hide Preview" : "Preview"}
                      </button>

                      <button
                        type="button"
                        className="inspector-action-btn"
                        onClick={() =>
                          copyToClipboard(
                            getImportStatement(asset),
                            "✓ Import copied",
                          )
                        }
                        title={`Copy import statement: ${getImportStatement(asset)}`}
                      >
                        Copy Import
                      </button>

                      <button
                        type="button"
                        className="inspector-action-btn"
                        onClick={() =>
                          copyToClipboard(
                            getJsxSnippet(asset),
                            "✓ JSX copied",
                          )
                        }
                        title={`Copy JSX snippet: ${getJsxSnippet(asset)}`}
                      >
                        Copy JSX
                      </button>
                    </div>
                  </div>

                  <div className="inspector-asset-row__meta">
                    <span
                      style={
                        isLarge
                          ? { color: "#dc2626", fontWeight: 700 }
                          : undefined
                      }
                    >
                      {formatBytes(asset.size)}
                    </span>

                    {asset.width !== undefined &&
                      asset.height !== undefined && (
                        <span>
                          {asset.width} × {asset.height}
                        </span>
                      )}

                    <span>
                      {referenceCount}{" "}
                      {referenceCount === 1 ? "reference" : "references"}
                    </span>

                    <span
                      className={
                        isUsed
                          ? "inspector-status inspector-status--success"
                          : "inspector-status"
                      }
                    >
                      {isUsed ? "Used" : "Unused"}
                    </span>
                  </div>
                </div>

                {/* Inline preview drawer (F7) */}
                {isPreviewOpen && (
                  <div className="inspector-preview-drawer inspector-checkerboard">
                    <img
                      src={`/${asset.path.replace(/^\/+/, "")}`}
                      alt={asset.name}
                      className="inspector-preview-drawer__img"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget
                          .nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div
                      className="inspector-preview-drawer__fallback"
                      style={{ display: "none" }}
                    >
                      Preview unavailable
                    </div>
                  </div>
                )}
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

