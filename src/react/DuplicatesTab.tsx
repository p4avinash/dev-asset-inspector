import type { DuplicateGroup } from "./types.js";

type DuplicatesTabProps = {
  duplicates: DuplicateGroup[];
};

export function DuplicatesTab({ duplicates }: DuplicatesTabProps) {
  if (duplicates.length === 0) {
    return (
      <div className="inspector-duplicates">
        <div className="inspector-duplicates__empty">
          <span className="inspector-duplicates__empty-icon">◈</span>

          <h3>No duplicate assets</h3>

          <p>
            No duplicate asset groups were detected in the analyzed project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="inspector-duplicates">
      <div className="inspector-duplicates__header">
        <div>
          <span className="inspector-eyebrow">DUPLICATE ANALYSIS</span>

          <h3>Duplicates</h3>

          <p>
            Assets with identical content that may be consuming unnecessary
            space.
          </p>
        </div>

        <span className="inspector-duplicates__count">{duplicates.length}</span>
      </div>

      <div className="inspector-duplicate-list">
        {duplicates.map((group) => (
          <article key={group.hash} className="inspector-duplicate-group">
            <div className="inspector-duplicate-group__header">
              <div>
                <span className="inspector-duplicate-group__label">
                  DUPLICATE GROUP
                </span>

                <strong>
                  {group.assets.length} identical{" "}
                  {group.assets.length === 1 ? "asset" : "assets"}
                </strong>
              </div>

              <span className="inspector-duplicate-group__waste">
                {formatBytes(group.wastedSize)} wasted
              </span>
            </div>

            <div className="inspector-duplicate-group__summary">
              <span>
                Total size: <strong>{formatBytes(group.totalSize)}</strong>
              </span>

              <span>
                Hash: <code>{group.hash}</code>
              </span>
            </div>

            <div className="inspector-duplicate-assets">
              {group.assets.map((asset) => {
                const isCanonical = asset.path === group.canonicalAsset.path;

                return (
                  <div
                    key={asset.path}
                    className={`inspector-duplicate-asset ${
                      isCanonical ? "inspector-duplicate-asset--canonical" : ""
                    }`}
                  >
                    <div
                      className="inspector-duplicate-asset__icon inspector-checkerboard"
                      title={asset.name}
                    >
                      <img
                        src={`/${asset.path.replace(/^\/+/, "")}`}
                        alt={asset.name}
                        className="inspector-duplicate-asset__thumb"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget
                            .nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <span
                        className="inspector-duplicate-asset__thumb-fallback"
                        style={{ display: "none" }}
                      >
                        {asset.extension.replace(".", "").toUpperCase()}
                      </span>
                    </div>

                    <div className="inspector-duplicate-asset__content">
                      <div className="inspector-duplicate-asset__title-row">
                        <strong>{asset.name}</strong>

                        {isCanonical ? (
                          <span className="inspector-duplicate-asset__badge">
                            Canonical
                          </span>
                        ) : (
                          <span className="inspector-duplicate-asset__badge inspector-duplicate-asset__badge--dup">
                            Duplicate
                          </span>
                        )}
                      </div>

                      <span>{asset.path}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
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
