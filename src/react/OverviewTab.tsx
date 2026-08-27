import { useMemo, useState } from "react";
import type {
  AssetInfo,
  AssetInspectionReport,
  AssetInspectionSummary,
} from "./types.js";

type OverviewTabProps = {
  report?: AssetInspectionReport;
  summary?: AssetInspectionSummary;
  onNavigateTab?: (
    tab: "overview" | "assets" | "duplicates" | "optimization",
  ) => void;
};

type SelectedIssue =
  | "unused"
  | "duplicates"
  | "optimization"
  | "mismatches"
  | null;

type SortOption = "size-desc" | "size-asc" | "name-asc";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getImportIdentifier(filename: string): string {
  const baseName = filename.replace(/\.[^/.]+$/, "");
  const clean = baseName.replace(/[^a-zA-Z0-9_$]/g, "_");
  if (/^[0-9]/.test(clean)) return `_${clean}`;
  return clean || "asset";
}

function getImportStatement(asset: AssetInfo): string {
  const identifier = getImportIdentifier(asset.name);
  const normalizedPath = asset.path.replace(/^\/+/, "");
  return `import ${identifier} from "./${normalizedPath}";`;
}

function getJsxSnippet(asset: AssetInfo): string {
  const identifier = getImportIdentifier(asset.name);
  const altText = asset.name.replace(/\.[^/.]+$/, "");
  return `<img src={${identifier}} alt="${altText}" />`;
}

export function OverviewTab({
  report,
  summary: summaryProp,
  onNavigateTab,
}: OverviewTabProps) {
  const summary = report?.summary ?? summaryProp;
  const [selectedIssue, setSelectedIssue] = useState<SelectedIssue>(null);
  const [issueSearch, setIssueSearch] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("size-desc");
  const [expandedPreviews, setExpandedPreviews] = useState<Set<string>>(
    new Set(),
  );
  const [toast, setToast] = useState<{
    message: string;
    isError?: boolean;
  } | null>(null);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
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
    setExpandedPreviews((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const unusedAssets = useMemo(() => {
    if (!report?.usage) return [];
    return report.usage
      .filter((u) => u.status === "NOT_REFERENCED")
      .map((u) => u.asset);
  }, [report?.usage]);

  const mismatchedAssets = useMemo(() => {
    if (!report?.assets) return [];
    return report.assets.filter((a) => a.typeMismatch);
  }, [report?.assets]);

  const optimizationCandidates = useMemo(() => {
    if (!report?.optimization) return [];
    return report.optimization.filter((o) => o.isCandidate);
  }, [report?.optimization]);

  if (!summary) {
    return null;
  }

  // Filter and sort for the Issue Detail Page
  const filteredUnused = useMemo(() => {
    const q = issueSearch.trim().toLowerCase();
    const list = unusedAssets.filter(
      (a) =>
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.path.toLowerCase().includes(q),
    );
    return list.sort((a, b) => {
      if (sortOption === "size-desc") return b.size - a.size;
      if (sortOption === "size-asc") return a.size - b.size;
      return a.name.localeCompare(b.name);
    });
  }, [unusedAssets, issueSearch, sortOption]);

  const filteredMismatches = useMemo(() => {
    const q = issueSearch.trim().toLowerCase();
    const list = mismatchedAssets.filter(
      (a) =>
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.path.toLowerCase().includes(q),
    );
    return list.sort((a, b) => {
      if (sortOption === "size-desc") return b.size - a.size;
      if (sortOption === "size-asc") return a.size - b.size;
      return a.name.localeCompare(b.name);
    });
  }, [mismatchedAssets, issueSearch, sortOption]);

  const filteredOptimization = useMemo(() => {
    const q = issueSearch.trim().toLowerCase();
    const list = optimizationCandidates.filter(
      ({ asset, reasons }) =>
        !q ||
        asset.name.toLowerCase().includes(q) ||
        asset.path.toLowerCase().includes(q) ||
        reasons.some((r) => r.toLowerCase().includes(q)),
    );
    return list.sort((a, b) => {
      if (sortOption === "size-desc") return b.asset.size - a.asset.size;
      if (sortOption === "size-asc") return a.asset.size - b.asset.size;
      return a.asset.name.localeCompare(b.asset.name);
    });
  }, [optimizationCandidates, issueSearch, sortOption]);

  const filteredDuplicates = useMemo(() => {
    const q = issueSearch.trim().toLowerCase();
    if (!report?.duplicates) return [];
    return report.duplicates.filter((group) => {
      if (!q) return true;
      return group.assets.some(
        (a) =>
          a.name.toLowerCase().includes(q) || a.path.toLowerCase().includes(q),
      );
    });
  }, [report?.duplicates, issueSearch]);

  // -------------------------------------------------------------
  // DEDICATED ISSUE DETAIL PAGE
  // -------------------------------------------------------------
  if (selectedIssue !== null) {
    const titles: Record<
      NonNullable<SelectedIssue>,
      { title: string; desc: string; icon: string; count: number }
    > = {
      unused: {
        title: "Unused Assets",
        desc: "Assets detected in project folders with zero code references.",
        icon: "!",
        count: unusedAssets.length,
      },
      duplicates: {
        title: "Duplicate Groups",
        desc: "Identical files sharing matching SHA-256 byte hashes.",
        icon: "◈",
        count: report?.duplicates.length ?? 0,
      },
      optimization: {
        title: "Optimization Candidates",
        desc: "Assets with high dimensions, heavy file sizes, or high optimization impact.",
        icon: "↑",
        count: optimizationCandidates.length,
      },
      mismatches: {
        title: "Type Mismatches",
        desc: "Files whose declared extension does not match magic-byte MIME signature.",
        icon: "M",
        count: mismatchedAssets.length,
      },
    };

    const currentMeta = titles[selectedIssue];

    return (
      <div className="inspector-issue-page">
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

        {/* Back navigation header */}
        <div className="inspector-issue-page__topbar">
          <button
            type="button"
            className="inspector-back-btn"
            onClick={() => {
              setSelectedIssue(null);
              setIssueSearch("");
            }}
          >
            ← Back to Overview
          </button>

          <span className="inspector-issue-page__breadcrumb">
            Overview / Issues / {currentMeta.title}
          </span>
        </div>

        {/* Issue Hero */}
        <div className="inspector-issue-page__hero">
          <div className="inspector-issue-page__hero-icon">
            {currentMeta.icon}
          </div>

          <div className="inspector-issue-page__hero-content">
            <div className="inspector-issue-page__hero-title">
              <h3>{currentMeta.title}</h3>
              <span className="inspector-issue-page__badge">
                {currentMeta.count}{" "}
                {selectedIssue === "duplicates" ? "groups" : "assets"}
              </span>
              {selectedIssue === "duplicates" && (
                <span className="inspector-issue-page__badge inspector-issue-page__badge--warn">
                  {formatBytes(summary.wastedBytes)} wasted
                </span>
              )}
            </div>
            <p>{currentMeta.desc}</p>
          </div>
        </div>

        {/* Toolbar: Search and Sort */}
        <div className="inspector-issue-page__toolbar">
          <label className="inspector-search">
            <span className="inspector-search__icon">⌕</span>
            <input
              type="search"
              value={issueSearch}
              onChange={(e) => setIssueSearch(e.target.value)}
              placeholder={`Search ${currentMeta.title.toLowerCase()}...`}
            />
            {issueSearch && (
              <button
                type="button"
                className="inspector-search__clear"
                onClick={() => setIssueSearch("")}
              >
                ×
              </button>
            )}
          </label>

          {selectedIssue !== "duplicates" && (
            <div className="inspector-issue-page__sort">
              <span className="inspector-sort-label">Sort:</span>
              <button
                type="button"
                className={`inspector-sort-btn ${
                  sortOption === "size-desc" ? "inspector-sort-btn--active" : ""
                }`}
                onClick={() => setSortOption("size-desc")}
                title="Largest first"
              >
                Size ↓
              </button>
              <button
                type="button"
                className={`inspector-sort-btn ${
                  sortOption === "size-asc" ? "inspector-sort-btn--active" : ""
                }`}
                onClick={() => setSortOption("size-asc")}
                title="Smallest first"
              >
                Size ↑
              </button>
              <button
                type="button"
                className={`inspector-sort-btn ${
                  sortOption === "name-asc" ? "inspector-sort-btn--active" : ""
                }`}
                onClick={() => setSortOption("name-asc")}
                title="Alphabetical"
              >
                Name A-Z
              </button>
            </div>
          )}
        </div>

        {/* Issue items list */}
        <div className="inspector-issue-page__list">
          {/* 1. Unused Assets View */}
          {selectedIssue === "unused" && (
            <>
              {filteredUnused.length === 0 ? (
                <div className="inspector-issue-page__empty">
                  No unused assets match your search.
                </div>
              ) : (
                filteredUnused.map((asset) => {
                  const assetKey = asset.id || asset.path;
                  const isPreviewOpen = expandedPreviews.has(assetKey);
                  return (
                    <article
                      key={assetKey}
                      className="inspector-issue-card"
                    >
                      <div className="inspector-issue-card__main">
                        {/* Thumbnail with checkerboard for transparent SVG/PNG visibility */}
                        <div
                          className="inspector-issue-card__thumb-box inspector-checkerboard"
                          title={asset.name}
                        >
                          <img
                            src={`/${asset.path.replace(/^\/+/, "")}`}
                            alt={asset.name}
                            className="inspector-issue-card__thumb"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget
                                .nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                          <span
                            className="inspector-issue-card__thumb-fallback"
                            style={{ display: "none" }}
                          >
                            {asset.extension.replace(".", "").toUpperCase()}
                          </span>
                        </div>

                        <div className="inspector-issue-card__info">
                          <div className="inspector-issue-card__header">
                            <strong>{asset.name}</strong>
                            <span className="inspector-badge inspector-badge--unused">
                              0 references
                            </span>
                          </div>

                          <span className="inspector-issue-card__path">
                            {asset.path}
                          </span>

                          {/* Scanner Details Chips */}
                          <div className="inspector-issue-card__chips">
                            <span className="inspector-chip">
                              📦 {formatBytes(asset.size)} ({asset.size.toLocaleString()} B)
                            </span>
                            {asset.width && asset.height && (
                              <span className="inspector-chip">
                                📐 {asset.width} × {asset.height} px
                              </span>
                            )}
                            {asset.mimeType && (
                              <span className="inspector-chip">
                                🏷️ {asset.mimeType}
                              </span>
                            )}
                            {asset.hash && (
                              <button
                                type="button"
                                className="inspector-chip inspector-chip--clickable"
                                onClick={() =>
                                  copyToClipboard(asset.hash!, "✓ Hash copied")
                                }
                                title={`Copy full SHA-256 hash: ${asset.hash}`}
                              >
                                🔑 {asset.hash.slice(0, 10)}… 📋
                              </button>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="inspector-asset-actions">
                            <button
                              type="button"
                              className={`inspector-action-btn ${
                                isPreviewOpen
                                  ? "inspector-action-btn--active"
                                  : ""
                              }`}
                              onClick={() => togglePreview(assetKey)}
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
                            >
                              Copy JSX
                            </button>
                            {onNavigateTab && (
                              <button
                                type="button"
                                className="inspector-action-btn"
                                onClick={() => onNavigateTab("assets")}
                              >
                                View in Assets tab ›
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Preview Drawer */}
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
                })
              )}
            </>
          )}

          {/* 2. Duplicate Groups View */}
          {selectedIssue === "duplicates" && (
            <>
              {filteredDuplicates.length === 0 ? (
                <div className="inspector-issue-page__empty">
                  No duplicate groups match your search.
                </div>
              ) : (
                filteredDuplicates.map((group, idx) => (
                  <article
                    key={group.hash}
                    className="inspector-issue-group-card"
                  >
                    <div className="inspector-issue-group-card__header">
                      <div>
                        <span className="inspector-eyebrow">
                          DUPLICATE GROUP #{idx + 1}
                        </span>
                        <h4>
                          {group.assets.length} identical assets (
                          {formatBytes(group.wastedSize)} wasted)
                        </h4>
                      </div>

                      <button
                        type="button"
                        className="inspector-chip inspector-chip--clickable"
                        onClick={() =>
                          copyToClipboard(group.hash, "✓ Group hash copied")
                        }
                        title={`Copy hash: ${group.hash}`}
                      >
                        🔑 {group.hash.slice(0, 12)}…
                      </button>
                    </div>

                    <div className="inspector-issue-group-card__assets">
                      {group.assets.map((asset) => {
                        const isCanonical =
                          asset.path === group.canonicalAsset.path;
                        return (
                          <div
                            key={asset.path}
                            className={`inspector-issue-card__main ${
                              isCanonical ? "inspector-card--canonical" : ""
                            }`}
                          >
                            <div className="inspector-issue-card__thumb-box inspector-checkerboard">
                              <img
                                src={`/${asset.path.replace(/^\/+/, "")}`}
                                alt={asset.name}
                                className="inspector-issue-card__thumb"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget
                                    .nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                              <span
                                className="inspector-issue-card__thumb-fallback"
                                style={{ display: "none" }}
                              >
                                {asset.extension
                                  .replace(".", "")
                                  .toUpperCase()}
                              </span>
                            </div>

                            <div className="inspector-issue-card__info">
                              <div className="inspector-issue-card__header">
                                <strong>{asset.name}</strong>
                                {isCanonical ? (
                                  <span className="inspector-badge inspector-badge--canonical">
                                    Canonical
                                  </span>
                                ) : (
                                  <span className="inspector-badge inspector-badge--duplicate">
                                    Duplicate
                                  </span>
                                )}
                              </div>
                              <span className="inspector-issue-card__path">
                                {asset.path}
                              </span>

                              <div className="inspector-issue-card__chips">
                                <span className="inspector-chip">
                                  📦 {formatBytes(asset.size)}
                                </span>
                                {asset.width && asset.height && (
                                  <span className="inspector-chip">
                                    📐 {asset.width} × {asset.height} px
                                  </span>
                                )}
                              </div>

                              <div className="inspector-asset-actions">
                                <button
                                  type="button"
                                  className="inspector-action-btn"
                                  onClick={() =>
                                    copyToClipboard(
                                      getImportStatement(asset),
                                      "✓ Import copied",
                                    )
                                  }
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
                                >
                                  Copy JSX
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))
              )}
            </>
          )}

          {/* 3. Optimization Candidates View */}
          {selectedIssue === "optimization" && (
            <>
              {filteredOptimization.length === 0 ? (
                <div className="inspector-issue-page__empty">
                  No optimization candidates match your search.
                </div>
              ) : (
                filteredOptimization.map(
                  ({ asset, reasons, severity, score }) => {
                    const assetKey = asset.id || asset.path;
                    const isPreviewOpen = expandedPreviews.has(assetKey);
                    return (
                      <article
                        key={assetKey}
                        className="inspector-issue-card"
                      >
                        <div className="inspector-issue-card__main">
                          <div className="inspector-issue-card__thumb-box inspector-checkerboard">
                            <img
                              src={`/${asset.path.replace(/^\/+/, "")}`}
                              alt={asset.name}
                              className="inspector-issue-card__thumb"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fallback = e.currentTarget
                                  .nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                            <span
                              className="inspector-issue-card__thumb-fallback"
                              style={{ display: "none" }}
                            >
                              {asset.extension.replace(".", "").toUpperCase()}
                            </span>
                          </div>

                          <div className="inspector-issue-card__info">
                            <div className="inspector-issue-card__header">
                              <strong>{asset.name}</strong>
                              <span
                                className={`inspector-optimization-severity inspector-optimization-severity--${
                                  severity ?? "high"
                                }`}
                              >
                                {(severity ?? "high").toUpperCase()}
                              </span>
                            </div>

                            <span className="inspector-issue-card__path">
                              {asset.path}
                            </span>

                            <div className="inspector-issue-card__reasons">
                              {reasons.map((r, i) => (
                                <span
                                  key={i}
                                  className="inspector-reason-tag"
                                >
                                  ⚠️ {r}
                                </span>
                              ))}
                            </div>

                            <div className="inspector-issue-card__chips">
                              <span className="inspector-chip">
                                📦 {formatBytes(asset.size)} ({asset.size.toLocaleString()} B)
                              </span>
                              {asset.width && asset.height && (
                                <span className="inspector-chip">
                                  📐 {asset.width} × {asset.height} px
                                </span>
                              )}
                              {score !== undefined && (
                                <span className="inspector-chip">
                                  🎯 Impact Score: {score}
                                </span>
                              )}
                            </div>

                            <div className="inspector-asset-actions">
                              <button
                                type="button"
                                className={`inspector-action-btn ${
                                  isPreviewOpen
                                    ? "inspector-action-btn--active"
                                    : ""
                                }`}
                                onClick={() => togglePreview(assetKey)}
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
                              >
                                Copy JSX
                              </button>
                              {onNavigateTab && (
                                <button
                                  type="button"
                                  className="inspector-action-btn"
                                  onClick={() => onNavigateTab("optimization")}
                                >
                                  Optimization tab ›
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

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
                          </div>
                        )}
                      </article>
                    );
                  },
                )
              )}
            </>
          )}

          {/* 4. Type Mismatches View */}
          {selectedIssue === "mismatches" && (
            <>
              {filteredMismatches.length === 0 ? (
                <div className="inspector-issue-page__empty">
                  No type mismatches match your search.
                </div>
              ) : (
                filteredMismatches.map((asset) => {
                  const assetKey = asset.id || asset.path;
                  const isPreviewOpen = expandedPreviews.has(assetKey);
                  return (
                    <article
                      key={assetKey}
                      className="inspector-issue-card"
                    >
                      <div className="inspector-issue-card__main">
                        <div className="inspector-issue-card__thumb-box inspector-checkerboard">
                          <img
                            src={`/${asset.path.replace(/^\/+/, "")}`}
                            alt={asset.name}
                            className="inspector-issue-card__thumb"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget
                                .nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                          <span
                            className="inspector-issue-card__thumb-fallback"
                            style={{ display: "none" }}
                          >
                            {asset.extension.replace(".", "").toUpperCase()}
                          </span>
                        </div>

                        <div className="inspector-issue-card__info">
                          <div className="inspector-issue-card__header">
                            <strong>{asset.name}</strong>
                            <span className="inspector-badge inspector-badge--mismatch">
                              Extension Mismatch
                            </span>
                          </div>

                          <span className="inspector-issue-card__path">
                            {asset.path}
                          </span>

                          <div className="inspector-mismatch-banner">
                            Declared extension:{" "}
                            <strong>{asset.extension.toUpperCase()}</strong> →
                            Actual file format:{" "}
                            <strong>
                              {asset.detectedExtension?.toUpperCase() ??
                                "UNKNOWN"}{" "}
                              ({asset.detectedMimeType})
                            </strong>
                          </div>

                          <div className="inspector-issue-card__chips">
                            <span className="inspector-chip">
                              📦 {formatBytes(asset.size)}
                            </span>
                            {asset.width && asset.height && (
                              <span className="inspector-chip">
                                📐 {asset.width} × {asset.height} px
                              </span>
                            )}
                            {asset.mimeType && (
                              <span className="inspector-chip">
                                🏷️ MIME: {asset.mimeType}
                              </span>
                            )}
                          </div>

                          <div className="inspector-asset-actions">
                            <button
                              type="button"
                              className={`inspector-action-btn ${
                                isPreviewOpen
                                  ? "inspector-action-btn--active"
                                  : ""
                              }`}
                              onClick={() => togglePreview(assetKey)}
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
                            >
                              Copy JSX
                            </button>
                          </div>
                        </div>
                      </div>

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
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN OVERVIEW PAGE
  // -------------------------------------------------------------
  return (
    <div className="inspector-overview">
      <div className="inspector-overview__heading">
        <div>
          <span className="inspector-eyebrow">PROJECT HEALTH</span>
          <h3>Asset Overview</h3>
          <p>Quick snapshot of the assets detected in your project.</p>
        </div>

        <div className="inspector-health-badge">
          <span className="inspector-health-badge__dot" />
          Analysis ready
        </div>
      </div>

      <div className="inspector-stats">
        <article className="inspector-stat-card">
          <span className="inspector-stat-card__label">Total assets</span>
          <strong className="inspector-stat-card__value">
            {summary.totalAssets}
          </strong>
          <span className="inspector-stat-card__meta">detected</span>
        </article>

        <article className="inspector-stat-card">
          <span className="inspector-stat-card__label">Used assets</span>
          <strong className="inspector-stat-card__value">
            {summary.usedAssets}
          </strong>
          <span className="inspector-stat-card__meta">referenced</span>
        </article>

        <article className="inspector-stat-card inspector-stat-card--warning">
          <span className="inspector-stat-card__label">Unused assets</span>
          <strong className="inspector-stat-card__value">
            {summary.unusedAssets}
          </strong>
          <span className="inspector-stat-card__meta">not referenced</span>
        </article>

        <article className="inspector-stat-card">
          <span className="inspector-stat-card__label">Duplicate groups</span>
          <strong className="inspector-stat-card__value">
            {summary.duplicateGroups}
          </strong>
          <span className="inspector-stat-card__meta">detected</span>
        </article>
      </div>

      {/* Potential Issues Section — Clicking opens the dedicated page */}
      <section className="inspector-section">
        <div className="inspector-section__header">
          <div>
            <span className="inspector-eyebrow">ATTENTION</span>
            <h3>Potential issues</h3>
            <p>Click any issue to open its dedicated breakdown page.</p>
          </div>
        </div>

        <div className="inspector-issue-list">
          {/* Issue 1: Unused Assets */}
          <button
            type="button"
            className="inspector-issue"
            onClick={() => setSelectedIssue("unused")}
            title="Open Unused Assets Page"
          >
            <span className="inspector-issue__icon">!</span>
            <span className="inspector-issue__content">
              <strong>Unused assets</strong>
              <span>Assets that are not referenced by the project.</span>
            </span>
            <span className="inspector-issue__value">
              {summary.unusedAssets}
            </span>
            <span className="inspector-issue__arrow">›</span>
          </button>

          {/* Issue 2: Duplicate Groups */}
          <button
            type="button"
            className="inspector-issue"
            onClick={() => setSelectedIssue("duplicates")}
            title="Open Duplicate Groups Page"
          >
            <span className="inspector-issue__icon">◈</span>
            <span className="inspector-issue__content">
              <strong>Duplicate groups</strong>
              <span>Multiple files with identical byte content.</span>
            </span>
            <span className="inspector-issue__value">
              {summary.duplicateGroups}
            </span>
            <span className="inspector-issue__arrow">›</span>
          </button>

          {/* Issue 3: Optimization Candidates */}
          <button
            type="button"
            className="inspector-issue"
            onClick={() => setSelectedIssue("optimization")}
            title="Open Optimization Candidates Page"
          >
            <span className="inspector-issue__icon">↑</span>
            <span className="inspector-issue__content">
              <strong>Optimization candidates</strong>
              <span>Assets that may be reduced, converted, or resized.</span>
            </span>
            <span className="inspector-issue__value">
              {summary.optimizationCandidates}
            </span>
            <span className="inspector-issue__arrow">›</span>
          </button>

          {/* Issue 4: Type Mismatches */}
          <button
            type="button"
            className="inspector-issue"
            onClick={() => setSelectedIssue("mismatches")}
            title="Open Type Mismatches Page"
          >
            <span className="inspector-issue__icon">M</span>
            <span className="inspector-issue__content">
              <strong>Type mismatches</strong>
              <span>File extension does not match detected MIME signature.</span>
            </span>
            <span className="inspector-issue__value">
              {summary.typeMismatches}
            </span>
            <span className="inspector-issue__arrow">›</span>
          </button>
        </div>
      </section>

      {/* Potential savings */}
      <section className="inspector-section">
        <div className="inspector-section__header">
          <div>
            <span className="inspector-eyebrow">OPTIMIZATION</span>
            <h3>Potential savings</h3>
          </div>
        </div>

        <div className="inspector-savings">
          <div className="inspector-savings__value">
            {(summary.wastedBytes / 1024).toFixed(1)} KB
          </div>

          <div className="inspector-savings__content">
            <strong>Potentially wasted storage</strong>
            <span>Estimated space associated with duplicate assets.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
