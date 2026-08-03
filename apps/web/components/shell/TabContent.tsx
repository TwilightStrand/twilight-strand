"use client";

import { useUiStore } from "@/stores/ui-store";
import type { TabId } from "@/stores/ui-store";
import { TreeCanvas } from "@/components/tree/TreeCanvas";

function Placeholder({ tab }: { tab: TabId }) {
  return (
    <div className="flex items-center justify-center h-full text-text-dim font-mono text-sm">
      {tab.charAt(0).toUpperCase() + tab.slice(1)} tab
    </div>
  );
}

export function TabContent() {
  const { activeTab } = useUiStore();

  return (
    <main className="flex-1 overflow-hidden bg-transparent">
      {activeTab === "tree" ? <TreeCanvas /> : <Placeholder tab={activeTab} />}
    </main>
  );
}
