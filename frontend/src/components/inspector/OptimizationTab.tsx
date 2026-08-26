import type { OptimizationResult } from "../../types/assetReport";

type OptimizationTabProps = {
  optimization: OptimizationResult[];
};

export function OptimizationTab({ optimization }: OptimizationTabProps) {
  const candidates = optimization.filter((item) => item.isCandidate);

  if (candidates.length === 0) {
    return (
      <div className="inspector-optimization">
        <div className="inspector-optimization__empty">
          <span className="inspector-optimization__empty-icon">↑</span>

          <h3>No optimization opportunities</h3>

          <p>
            No assets currently require optimization based on the available
            analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="inspector-optimization">
      <div className="inspector-optimization__header">
        <div>
          <span className="inspector-eyebrow">OPTIMIZATION ANALYSIS</span>

          <h3>Optimization</h3>

          <p>Assets that may benefit from optimization or replacement.</p>
        </div>

        <span className="inspector-optimization__count">
          {candidates.length}
        </span>
      </div>

      <div className="inspector-optimization-list">
        {candidates.map((result) => {
          const severity = result.severity ?? "low";

          return (
            <article
              key={`${result.asset.path}-${result.asset.hash}`}
              className="inspector-optimization-card"
            >
              <div className="inspector-optimization-card__header">
                <div className="inspector-optimization-card__asset">
                  <div
                    className="inspector-optimization-card__icon inspector-checkerboard"
                    title={result.asset.name}
                  >
                    <img
                      src={`/${result.asset.path.replace(/^\/+/, "")}`}
                      alt={result.asset.name}
                      className="inspector-optimization-card__thumb"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget
                          .nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <span
                      className="inspector-optimization-card__thumb-fallback"
                      style={{ display: "none" }}
                    >
                      {result.asset.extension.replace(".", "").toUpperCase()}
                    </span>
                  </div>

                  <div className="inspector-optimization-card__titles">
                    <strong>{result.asset.name}</strong>
                    <span>{result.asset.path}</span>
                  </div>
                </div>

                <span
                  className={`inspector-optimization-severity inspector-optimization-severity--${severity}`}
                >
                  {severity.toUpperCase()}
                </span>
              </div>

              <div className="inspector-optimization-card__score">
                <div className="inspector-optimization-card__score-label">
                  <span>Impact Score</span>
                  <strong
                    className={`inspector-score-pill inspector-score-pill--${severity}`}
                  >
                    {result.score}
                  </strong>
                </div>

                <div className="inspector-optimization-score-bar">
                  <div
                    className={`inspector-optimization-score-fill inspector-optimization-score-fill--${severity}`}
                    style={{
                      width: `${Math.min(Math.max(result.score * 10, 8), 100)}%`,
                    }}
                  />
                </div>
              </div>

              {result.reasons.length > 0 && (
                <div className="inspector-optimization-card__reasons">
                  <span className="inspector-optimization-card__reasons-title">
                    Flagged reasons
                  </span>

                  <div className="inspector-optimization-reasons-tags">
                    {result.reasons.map((reason) => (
                      <span key={reason} className="inspector-reason-tag">
                        ⚠️ {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="inspector-optimization-card__meta">
                <span className="inspector-chip">
                  📦 {formatBytes(result.asset.size)}
                </span>

                {result.asset.width !== undefined &&
                  result.asset.height !== undefined && (
                    <span className="inspector-chip">
                      📐 {result.asset.width} × {result.asset.height} px
                    </span>
                  )}

                {result.asset.mimeType && (
                  <span className="inspector-chip">
                    🏷️ {result.asset.mimeType}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
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
