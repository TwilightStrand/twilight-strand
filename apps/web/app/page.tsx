"use client";

import { useEffect } from "react";
import { Header } from "@/components/shell/Header";
import { StatsSidebar } from "@/components/shell/StatsSidebar";
import { TabContent } from "@/components/shell/TabContent";
import { MobileNav } from "@/components/shell/MobileNav";
import { ImportDialog } from "@/components/shell/ImportDialog";
import { useUiStore } from "@/stores/ui-store";

export default function Home() {
  const { importOpen, setImportOpen } = useUiStore();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && hash.length > 40) {
      import("@/stores/build-store").then((m) => {
        m.useBuildStore.getState().importBuild(hash);
      });
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        setImportOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          import("@/stores/tree-store").then((m) => m.useTreeStore.getState().redo());
        } else {
          import("@/stores/tree-store").then((m) => m.useTreeStore.getState().undo());
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setImportOpen]);

  return (
    <>
      <div className="h-dvh flex flex-col">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <StatsSidebar />
          <TabContent />
        </div>
        <MobileNav />
      </div>
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
