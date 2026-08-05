"use client";

import { useEffect, useState } from "react";
import { initLocale, t } from "@/lib/i18n";
import type { BuildStats } from "@/engine/types";
import { useBuildStore } from "@/stores/build-store";
import { useTreeStore } from "@/stores/tree-store";
import type { TabId } from "@/stores/ui-store";
import { TAB_LABELS, TABS, useUiStore } from "@/stores/ui-store";
import { AuthButton } from "./AuthButton";
import { BuildCard } from "./BuildCard";
import { toast } from "./Toast";

function RecentBuildsDropdown() {
  const [open, setOpen] = useState(false);
  const savedBuilds = useBuildStore((s) => s.savedBuilds);
  const importBuild = useBuildStore((s) => s.importBuild);

  useEffect(() => {
    if (!open) return;
    const clickHandler = () => setOpen(false);
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", clickHandler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("click", clickHandler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open]);

  if (savedBuilds.length === 0) return null;

  return (
    <div className="relative hidden sm:block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="text-xs font-mono text-text-dim hover:text-accent transition-colors px-2 py-1 rounded hover:bg-bg-hover"
        title="Recent builds"
      >
        Recent
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-bg-card border border-border-card rounded-lg shadow-xl z-50 min-w-48 py-1">
          {savedBuilds.slice(0, 5).map((build, i) => (
            <BuildCard
              key={i}
              name={build.name}
              className={build.className}
              ascendancy={build.ascendancy}
              level={build.level}
              compact
              onClick={() => {
                importBuild(build.code);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const TAB_ICONS: Record<TabId, string> = {
  tree: "⬡",
  items: "⚔",
  skills: "◈",
  config: "⚙",
  calcs: "△",
  settings: "☰",
};

function LastSavedIndicator() {
  const lastSaved = useBuildStore((s) => s.lastSaved);
  if (!lastSaved) return null;
  return (
    <span className="text-[9px] font-mono text-text-dim/40 hidden xl:inline">
      saved {new Date(lastSaved).toLocaleTimeString()}
    </span>
  );
}

function EngineStatus() {
  const status = useBuildStore((s) => s.engineStatus);
  const progress = useBuildStore((s) => s.engineProgress);
  const evaluating = useBuildStore((s) => s.evaluating);

  if (status === "ready" && !evaluating) return null;

  const label =
    status === "loading"
      ? progress || "Starting engine..."
      : status === "error"
        ? "Engine error"
        : evaluating
          ? "Calculating..."
          : null;

  if (!label) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono text-text-dim">
      {(status === "loading" || evaluating) && (
        <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
      )}
      {status === "error" && <span className="inline-block h-2 w-2 rounded-full bg-red-400" />}
      <span className="max-w-48 truncate">{label}</span>
    </div>
  );
}

function HeaderActions({ stats, hasCode }: { stats: BuildStats | null; hasCode: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="text-xs font-mono text-text-dim hover:text-text-primary px-1.5 py-1 rounded hover:bg-bg-hover transition-colors"
        title="Actions"
      >
        ...
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-bg-card border border-border-card rounded-lg shadow-xl z-50 min-w-36 py-1">
          {[
            { label: "Save", action: () => { useBuildStore.getState().saveBuild(); useBuildStore.getState().saveToCloud(); toast("Saved"); }, disabled: !hasCode },
            { label: "Share link", action: async () => { const { code } = useBuildStore.getState(); if (code) { await navigator.clipboard.writeText(`${window.location.origin}#${code}`); toast("Link copied"); } }, disabled: !stats },
            { label: "Export PoB", action: async () => { const xml = useBuildStore.getState().xml; if (!xml) return; const { encodePobCode } = await import("@/engine/pob-codec"); const code = encodePobCode(xml); if (code) { await navigator.clipboard.writeText(code); toast("PoB code copied"); } }, disabled: !stats },
            { label: "Copy as MD", action: async () => { const s = useBuildStore.getState(); if (!s.stats) return; const st = s.stats; const lines = [`# ${st.class_name} ${st.ascendancy} (Lv ${st.level})`, "", `DPS: ${Math.round(st.total_dps)} | Life: ${st.life} | ES: ${st.energy_shield}`]; await navigator.clipboard.writeText(lines.join("\n")); toast("Markdown copied"); }, disabled: !stats },
            { label: "New build", action: () => { useBuildStore.getState().clearBuild(); useTreeStore.getState().setAllocatedNodes(new Set()); }, disabled: false },
            { label: "Community", action: () => { window.location.href = "/community"; }, disabled: false },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => { item.action(); setOpen(false); }}
              disabled={item.disabled}
              className="w-full text-left px-3 py-1.5 text-xs font-mono text-text-dim hover:text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-30"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { activeTab, setActiveTab, setImportOpen, gameVersion, setGameVersion } = useUiStore();
  const stats = useBuildStore((s) => s.stats);
  const items = useBuildStore((s) => s.items);
  const skills = useBuildStore((s) => s.skills);
  const initEngine = useBuildStore((s) => s.initEngine);
  const buildName = useBuildStore((s) => s.buildName);
  const hasCode = useBuildStore((s) => !!s.code);
  const allocNodes = useTreeStore((s) => s.allocatedNodes);

  useEffect(() => {
    initLocale();
    initEngine();
  }, [initEngine]);

  const className = stats?.class_name ?? "Scion";
  const ascendancy = stats?.ascendancy || "";
  const level = stats?.level ?? 1;

  const CLASS_COLORS: Record<string, string> = {
    Marauder: "#c44",
    Witch: "#44c",
    Ranger: "#4c4",
    Duelist: "#c84",
    Templar: "#cc4",
    Shadow: "#8c4",
    Scion: "#ccc",
  };
  const ASCENDANCY_COLORS: Record<string, string> = {
    Juggernaut: "#c44",
    Berserker: "#c44",
    Chieftain: "#c44",
    Necromancer: "#44c",
    Elementalist: "#44c",
    Occultist: "#44c",
    Deadeye: "#4c4",
    Raider: "#4c4",
    Pathfinder: "#4c4",
    Gladiator: "#c84",
    Champion: "#c84",
    Slayer: "#c84",
    Inquisitor: "#cc4",
    Hierophant: "#cc4",
    Guardian: "#cc4",
    Assassin: "#8c4",
    Trickster: "#8c4",
    Saboteur: "#8c4",
    Ascendant: "#ccc",
  };

  function tabBadge(tab: TabId): string | null {
    switch (tab) {
      case "items":
        return items.length > 0 ? String(items.length) : null;
      case "skills":
        return skills.length > 0 ? String(skills.length) : null;
      case "tree":
        return allocNodes.size > 1 ? String(allocNodes.size - 1) : null;
      default:
        return null;
    }
  }

  return (
    <header className="h-12 min-h-12 md:h-14 md:min-h-14 border-b border-border-divider bg-bg-surface/60 backdrop-blur-sm flex items-center px-3 gap-2">
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <span className="text-accent font-display text-lg font-bold tracking-tight hidden sm:inline">
          Twilight Strand
        </span>
        <span className="text-accent font-display text-lg font-bold sm:hidden">TS</span>

        <span className="text-border-card hidden sm:inline">|</span>

        <div className="flex items-center gap-1.5 text-xs font-mono text-text-dim">
          <button
            onClick={() => setGameVersion(gameVersion === "poe1" ? "poe2" : "poe1")}
            className="bg-bg-card px-1.5 py-0.5 rounded text-text-primary hover:bg-bg-hover transition-colors"
            title="Switch game version"
          >
            {gameVersion === "poe1" ? "PoE 1" : "PoE 2"}
          </button>
          {gameVersion === "poe2" && <span className="text-[9px] font-mono text-amber-400">beta</span>}
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: ASCENDANCY_COLORS[ascendancy] || CLASS_COLORS[className] || "#888" }}
          />
          <span className="text-text-dim truncate max-w-32">{buildName}</span>
          <span className="text-text-dim/60 text-[10px]">Lv {level}</span>
        </div>
        {stats && (
          <div className="hidden lg:flex items-center gap-1.5 text-[9px] font-mono text-text-dim/50 ml-1">
            <span>{allocNodes.size > 1 ? allocNodes.size - 1 : 0} pts</span>
            <span className="text-text-dim/30">|</span>
            <span>
              {(() => { const d = (stats.full_dps && stats.full_dps > 0 ? stats.full_dps : null) ?? stats.total_dps; return d >= 1e6 ? `${(d / 1e6).toFixed(1)}M` : d >= 1e3 ? `${Math.round(d / 1e3)}k` : Math.round(d); })()}{" "}
              DPS
            </span>
          </div>
        )}
      </div>

      <EngineStatus />

      <nav
        className="hidden md:flex items-center gap-0.5 ml-4"
        aria-label="Build sections"
        onKeyDown={(e) => {
          const idx = TABS.indexOf(activeTab);
          if (e.key === "ArrowRight" && idx < TABS.length - 1) {
            e.preventDefault();
            setActiveTab(TABS[idx + 1]);
            document.getElementById(`tab-${TABS[idx + 1]}`)?.focus();
          } else if (e.key === "ArrowLeft" && idx > 0) {
            e.preventDefault();
            setActiveTab(TABS[idx - 1]);
            document.getElementById(`tab-${TABS[idx - 1]}`)?.focus();
          }
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`tabpanel-${tab}`}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => setActiveTab(tab)}
            className={`
              relative flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-mono transition-colors
              ${
                activeTab === tab
                  ? "text-accent bg-bg-hover"
                  : "text-text-dim hover:text-text-primary hover:bg-bg-hover/50"
              }
            `}
          >
            <span className="text-xs">{TAB_ICONS[tab]}</span>
            {t(TAB_LABELS[tab])}
            {(() => {
              const badge = tabBadge(tab);
              return badge ? (
                <span className="text-[8px] font-mono bg-accent/20 text-accent px-1 rounded-full">{badge}</span>
              ) : null;
            })()}
            {activeTab === tab && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full" />}
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setImportOpen(true)}
          className="text-xs font-mono text-accent px-2.5 py-1 rounded border border-accent/25 hover:bg-accent/10 transition-colors"
        >
          Import
        </button>
        <HeaderActions stats={stats} hasCode={hasCode} />
        <AuthButton />
      </div>
    </header>
  );
}
