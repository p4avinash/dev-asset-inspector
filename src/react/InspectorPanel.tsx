import { useState } from "react";
import type { AssetInspectionReport } from "./types.js";
import { InspectorTabs, type InspectorTab } from "./InspectorTabs.js";
import { OverviewTab } from "./OverviewTab.js";
import { AssetsTab } from "./AssetsTab.js";
import { DuplicatesTab } from "./DuplicatesTab.js";
import { OptimizationTab } from "./OptimizationTab.js";

type InspectorPanelProps = {
  report: AssetInspectionReport | null;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onUseMockData?: () => void;
  maximized: boolean;
  isClosing?: boolean;
  onClose: () => void;
  onToggleMaximize: () => void;
};

export function InspectorPanel({
  report,
  isLoading = false,
  error = null,
  onRefresh,
  onUseMockData,
  maximized,
  isClosing = false,
  onClose,
  onToggleMaximize,
}: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("overview");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      const saved = localStorage.getItem("dev-asset-inspector-theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch {}
    return "dark";
  });

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("dev-asset-inspector-theme", next);
    } catch {}
  };

  return (
    <section
      className={`inspector-panel ${
        maximized ? "inspector-panel--maximized" : ""
      } ${isClosing ? "inspector-panel--closing" : ""}`}
      data-theme={theme}
      aria-label="Dev Asset Inspector"
    >
      <header className="inspector-panel__header">
        <div className="inspector-panel__title">
          <span className="inspector-panel__logo">◈</span>

          <div>
            <h2>Dev Asset Inspector</h2>
            <span>Development mode</span>
          </div>
        </div>

        <div className="inspector-panel__actions">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh analysis"
              title="Rescan project assets"
              className={`inspector-refresh-btn ${
                isLoading ? "inspector-refresh-btn--spinning" : ""
              }`}
            >
              ↻
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            className="inspector-theme-btn"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <button
            type="button"
            onClick={onToggleMaximize}
            aria-label={maximized ? "Restore inspector" : "Maximize inspector"}
            title={maximized ? "Restore" : "Maximize"}
          >
            {maximized ? "❐" : "□"}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspector"
            title="Close"
          >
            ×
          </button>
        </div>
      </header>

      <InspectorTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="inspector-panel__body">
        {isLoading && !report && (
          <div className="inspector-tab-placeholder">
            <span className="inspector-tab-placeholder__icon">↻</span>
            <h3>Analyzing Project Assets</h3>
            <p>Scanning project directories for images and SVGs...</p>
          </div>
        )}

        {error && !report && (
          <div className="inspector-tab-placeholder inspector-tab-placeholder--error">
            <span className="inspector-tab-placeholder__icon">!</span>
            <h3>Unable to scan assets</h3>
            <p>{error}</p>
            <div className="inspector-tab-placeholder__actions">
              {onRefresh && (
                <button
                  type="button"
                  className="inspector-action-btn"
                  onClick={onRefresh}
                >
                  Retry Scan
                </button>
              )}
              {onUseMockData && (
                <button
                  type="button"
                  className="inspector-action-btn"
                  onClick={onUseMockData}
                >
                  Preview Mock Data
                </button>
              )}
            </div>
          </div>
        )}

        {report && activeTab === "overview" && (
          <OverviewTab report={report} onNavigateTab={setActiveTab} />
        )}

        {report && activeTab === "assets" && (
          <AssetsTab
            assets={report.assets}
            usage={report.usage}
            duplicates={report.duplicates}
          />
        )}

        {report && activeTab === "duplicates" && (
          <DuplicatesTab duplicates={report.duplicates} />
        )}

        {report && activeTab === "optimization" && (
          <OptimizationTab optimization={report.optimization} />
        )}
      </div>

      <footer className="inspector-panel__footer">
        <div className="inspector-panel__status">
          <span
            className={`inspector-status-dot ${
              isLoading ? "inspector-status-dot--loading" : ""
            }`}
          />
          <span>
            {isLoading
              ? "Scanning project assets..."
              : error && !report
                ? "Analysis offline"
                : `${report?.assets.length ?? 0} assets scanned`}
          </span>
        </div>

        {onRefresh && (
          <button
            type="button"
            className="inspector-footer-refresh-btn"
            title="Rescan project assets"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? "Rescanning..." : "↻ Rescan"}
          </button>
        )}
      </footer>
    </section>
  );
}
