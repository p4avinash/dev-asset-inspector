import type { AssetInspectionSummary } from "../../types/assetReport";

type OverviewTabProps = {
  summary: AssetInspectionSummary;
};

export function OverviewTab({ summary }: OverviewTabProps) {
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

      <section className="inspector-section">
        <div className="inspector-section__header">
          <div>
            <span className="inspector-eyebrow">ATTENTION</span>

            <h3>Potential issues</h3>

            <p>Things worth reviewing in your asset library.</p>
          </div>
        </div>

        <div className="inspector-issue-list">
          <button type="button" className="inspector-issue">
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

          <button type="button" className="inspector-issue">
            <span className="inspector-issue__icon">◈</span>

            <span className="inspector-issue__content">
              <strong>Duplicate groups</strong>

              <span>Multiple files with identical content.</span>
            </span>

            <span className="inspector-issue__value">
              {summary.duplicateGroups}
            </span>

            <span className="inspector-issue__arrow">›</span>
          </button>

          <button type="button" className="inspector-issue">
            <span className="inspector-issue__icon">↑</span>

            <span className="inspector-issue__content">
              <strong>Optimization candidates</strong>

              <span>Assets that may be reduced or optimized.</span>
            </span>

            <span className="inspector-issue__value">
              {summary.optimizationCandidates}
            </span>

            <span className="inspector-issue__arrow">›</span>
          </button>

          <button type="button" className="inspector-issue">
            <span className="inspector-issue__icon">M</span>

            <span className="inspector-issue__content">
              <strong>Type mismatches</strong>

              <span>File extension does not match detected type.</span>
            </span>

            <span className="inspector-issue__value">
              {summary.typeMismatches}
            </span>

            <span className="inspector-issue__arrow">›</span>
          </button>
        </div>
      </section>

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
