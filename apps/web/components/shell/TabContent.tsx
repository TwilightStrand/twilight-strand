
import { useUiStore } from "@/stores/ui-store";
import type { TabId } from "@/stores/ui-store";
import { ErrorBoundary } from "@/components/shell/ErrorBoundary";
import { TreeCanvas } from "@/components/tree/TreeCanvas";
import { ItemsTab } from "@/components/items/ItemsTab";
import { SkillsTab } from "@/components/skills/SkillsTab";
import { ConfigTab } from "@/components/config/ConfigTab";
import { CalcsTab } from "@/components/calcs/CalcsTab";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

function renderTab(tab: TabId) {
  switch (tab) {
    case "tree":
      return <TreeCanvas />;
    case "items":
      return <ItemsTab />;
    case "skills":
      return <SkillsTab />;
    case "config":
      return <ConfigTab />;
    case "calcs":
      return <CalcsTab />;
    case "settings":
      return <SettingsPanel />;
    default:
      return null;
  }
}

export function TabContent() {
  const { activeTab } = useUiStore();

  return (
    <main className="flex-1 overflow-hidden bg-transparent">
      <ErrorBoundary name={activeTab} key={activeTab}>
        {renderTab(activeTab)}
      </ErrorBoundary>
    </main>
  );
}
