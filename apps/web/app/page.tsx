"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/shell/Header";
import { StatsSidebar } from "@/components/shell/StatsSidebar";
import { TabContent } from "@/components/shell/TabContent";
import { MobileNav } from "@/components/shell/MobileNav";
import { ImportDialog } from "@/components/shell/ImportDialog";
import { KeyboardShortcuts } from "@/components/shell/KeyboardShortcuts";
import { WelcomeHint } from "@/components/shell/WelcomeHint";
import { ErrorBoundary } from "@/components/shell/ErrorBoundary";
import { useUiStore } from "@/stores/ui-store";
import { useBuildStore } from "@/stores/build-store";

export default function Home() {
  const { importOpen, setImportOpen } = useUiStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const buildName = useBuildStore((s) => s.buildName);
  const stats = useBuildStore((s) => s.stats);

  useEffect(() => {
    if (stats && buildName !== "Unnamed Build") {
      document.title = `${buildName} - Twilight Strand`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        const dps = stats.total_dps >= 1e6 ? `${(stats.total_dps / 1e6).toFixed(1)}M` : stats.total_dps >= 1e3 ? `${Math.round(stats.total_dps / 1e3)}k` : String(Math.round(stats.total_dps));
        meta.setAttribute("content",
          `${stats.ascendancy || stats.class_name} Lv ${stats.level} - ${dps} DPS, ${stats.life} Life, ${stats.energy_shield} ES - Twilight Strand Build Planner`
        );
      }
    } else {
      document.title = "Twilight Strand - PoE Build Planner";
    }
  }, [buildName, stats]);

  const code = useBuildStore((s) => s.code);

  useEffect(() => {
    if (!stats || !code) return;
    const timer = setTimeout(() => {
      useBuildStore.getState().saveBuild();
    }, 30000);
    return () => clearTimeout(timer);
  }, [stats, code]);

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
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        import("@/stores/build-store").then((m) => m.useBuildStore.getState().saveBuild());
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          import("@/stores/tree-store").then((m) => m.useTreeStore.getState().redo());
        } else {
          import("@/stores/tree-store").then((m) => m.useTreeStore.getState().undo());
        }
      }
      if (e.key === "Escape") {
        const { importOpen, setImportOpen } = useUiStore.getState();
        if (importOpen) {
          setImportOpen(false);
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
          {sidebarOpen && (
            <ErrorBoundary name="sidebar">
              <StatsSidebar />
            </ErrorBoundary>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex w-4 items-center justify-center border-r border-border-subtle hover:bg-bg-hover/50 transition-colors shrink-0"
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <span className="text-text-dim text-[10px]">
              {sidebarOpen ? "‹" : "›"}
            </span>
          </button>
          <ErrorBoundary name="content">
            <TabContent />
          </ErrorBoundary>
        </div>
        <MobileNav />
      </div>
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <KeyboardShortcuts />
      <WelcomeHint />
    </>
  );
}
