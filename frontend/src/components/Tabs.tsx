import type { AppTab } from "../types";

type TabItem = {
  id: AppTab;
  label: string;
};

type TabsProps = {
  tabs: TabItem[];
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <nav className="flow-nav" aria-label="System sections">
      {tabs.map((tab) => (
        <button
          className={activeTab === tab.id ? "active" : ""}
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default Tabs;
