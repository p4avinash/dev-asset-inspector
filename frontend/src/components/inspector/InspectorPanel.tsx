import { useState } from "react";
import type { AssetInspectionReport } from "../../types/assetReport";
import { InspectorTabs, type InspectorTab } from "./InspectorTabs";
import { OverviewTab } from "./OverviewTab";
import { AssetsTab } from "./AssetsTab";
import { DuplicatesTab } from "./DuplicatesTab";
import { OptimizationTab } from "./OptimizationTab";

type InspectorPanelProps = {
  report: AssetInspectionReport;
  maximized: boolean;
  onClose: () => void;
  onToggleMaximize: () => void;
};

export function InspectorPanel({
  report,
  maximized,
  onClose,
  onToggleMaximize,
}: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("overview");

  return (
    <section
      className={`inspector-panel ${
        maximized ? "inspector-panel--maximized" : ""
      }`}
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
        {activeTab === "overview" && <OverviewTab summary={report.summary} />}

        {activeTab === "assets" && (
          <AssetsTab assets={report.assets} usage={report.usage} />
        )}

        {activeTab === "duplicates" && (
          <DuplicatesTab duplicates={report.duplicates} />
        )}

        {activeTab === "optimization" && (
          <OptimizationTab optimization={report.optimization} />
        )}
      </div>

      <footer className="inspector-panel__footer">
        <span>Dev Asset Inspector</span>

        <button
          type="button"
          className="inspector-panel__refresh"
          title="Refresh asset analysis"
        >
          ↻ Refresh
        </button>
      </footer>
    </section>
  );
}
