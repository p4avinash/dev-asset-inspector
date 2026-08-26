export type InspectorTab =
  | "overview"
  | "assets"
  | "duplicates"
  | "optimization";

type InspectorTabsProps = {
  activeTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
};

const tabs: Array<{ id: InspectorTab; label: string }> = [
  {
    id: "overview",
    label: "Overview",
  },
  {
    id: "assets",
    label: "Assets",
  },
  {
    id: "duplicates",
    label: "Duplicates",
  },
  {
    id: "optimization",
    label: "Optimize",
  },
];

export function InspectorTabs({ activeTab, onTabChange }: InspectorTabsProps) {
  return (
    <nav className="inspector-tabs" aria-label="Inspector sections">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            className={`inspector-tab ${
              isActive ? "inspector-tab--active" : ""
            }`}
            onClick={() => onTabChange(tab.id)}
            aria-selected={isActive}
            role="tab"
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
