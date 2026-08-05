"use client";

import { useEffect, useState } from "react";
import { ActivityBar } from "@/components/shell/ActivityBar";
import { ErrorBoundary } from "@/components/shell/ErrorBoundary";
import { ImportDialog } from "@/components/shell/ImportDialog";
import { KeyboardShortcuts } from "@/components/shell/KeyboardShortcuts";
import { MobileNav } from "@/components/shell/MobileNav";
import { MobileStats } from "@/components/shell/MobileStats";
import { StatsSidebar } from "@/components/shell/StatsSidebar";
import { StatusBar } from "@/components/shell/StatusBar";
import { TabContent } from "@/components/shell/TabContent";
import { ToastContainer } from "@/components/shell/Toast";
import { WelcomeHint } from "@/components/shell/WelcomeHint";
import { useBuildStore } from "@/stores/build-store";
import { useUiStore } from "@/stores/ui-store";

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
        const rawDps = (stats.full_dps && stats.full_dps > 0 ? stats.full_dps : null) ?? stats.total_dps;
        const dps =
          rawDps >= 1e6
            ? `${(rawDps / 1e6).toFixed(1)}M`
            : rawDps >= 1e3
              ? `${Math.round(rawDps / 1e3)}k`
              : String(Math.round(rawDps));
        meta.setAttribute(
          "content",
          `${stats.ascendancy || stats.class_name} Lv ${stats.level} - ${dps} DPS, ${stats.life} Life, ${stats.energy_shield} ES - Twilight Strand Build Planner`,
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
        const { importOpen: io, setImportOpen: sio } = useUiStore.getState();
        if (io) sio(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setImportOpen]);

  return (
    <>
      <div className="h-dvh flex flex-col">
        {/* Status bar (thin, replaces old header) */}
        <StatusBar />

        <div className="flex-1 flex overflow-hidden">
          {/* Activity bar (vertical icon nav) */}
          <ActivityBar />

          {/* Stats sidebar */}
          {sidebarOpen && (
            <ErrorBoundary name="sidebar">
              <StatsSidebar />
            </ErrorBoundary>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex w-3 items-center justify-center border-r border-border-subtle hover:bg-bg-hover/50 transition-colors shrink-0"
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <span className="text-text-dim/30 text-[8px]">{sidebarOpen ? "‹" : "›"}</span>
          </button>

          {/* Main content */}
          <ErrorBoundary name="content">
            <TabContent />
          </ErrorBoundary>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <KeyboardShortcuts />
      <WelcomeHint />
      <MobileStats />
      <ToastContainer />
    </>
  );
}
