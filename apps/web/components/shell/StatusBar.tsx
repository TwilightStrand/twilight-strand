"use client";

import { useEffect, useState } from "react";
import type { BuildStats } from "@/engine/types";
import { initLocale } from "@/lib/i18n";
import { useBuildStore } from "@/stores/build-store";
import { useTreeStore } from "@/stores/tree-store";
import { useUiStore } from "@/stores/ui-store";
import { AuthButton } from "./AuthButton";
import { toast } from "./Toast";

function fmtDps(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
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
        className="text-xs font-mono text-text-dim hover:text-text-primary px-1.5 py-0.5 rounded hover:bg-bg-hover transition-colors"
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

export function StatusBar() {
  const stats = useBuildStore((s) => s.stats);
  const hasCode = useBuildStore((s) => !!s.code);
  const buildName = useBuildStore((s) => s.buildName);
  const engineStatus = useBuildStore((s) => s.engineStatus);
  const engineProgress = useBuildStore((s) => s.engineProgress);
  const initEngine = useBuildStore((s) => s.initEngine);
  const { setImportOpen } = useUiStore();

  useEffect(() => {
    initLocale();
    initEngine();
  }, [initEngine]);

  const className = stats?.class_name ?? "Scion";
  const ascendancy = stats?.ascendancy || "";
  const level = stats?.level ?? 1;
  const dps = stats?.combined_dps ?? stats?.total_dps ?? 0;
  const life = stats?.life ?? 0;

  return (
    <header className="h-9 flex items-center px-3 border-b border-border-subtle bg-bg-surface/50 shrink-0">
      <span className="text-accent font-display text-sm font-bold mr-3 hidden sm:inline">TS</span>

      <div className="flex items-center gap-2 text-xs font-mono min-w-0">
        <span className="text-text-primary truncate max-w-40">{buildName}</span>
        <span className="text-text-dim/40">Lv {level}</span>
        {ascendancy && <span className="text-text-dim/60">{ascendancy}</span>}
        {!ascendancy && className !== "Scion" && <span className="text-text-dim/60">{className}</span>}
      </div>

      {stats && dps > 0 && (
        <div className="hidden lg:flex items-center gap-2 ml-3 text-[10px] font-mono text-text-dim/50">
          <span className="text-offence tabular-nums">{fmtDps(dps)} DPS</span>
          <span className="text-life tabular-nums">{Math.round(life)} HP</span>
        </div>
      )}

      {engineStatus === "loading" && (
        <span className="text-[9px] font-mono text-amber-400/60 ml-3 truncate max-w-40 hidden sm:inline">
          {engineProgress || "Loading..."}
        </span>
      )}

      <span className="flex-1" />

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setImportOpen(true)}
          className="text-[11px] font-mono text-accent px-2 py-0.5 rounded border border-accent/25 hover:bg-accent/10 transition-colors hidden sm:inline-block"
        >
          Import
        </button>
        <HeaderActions stats={stats} hasCode={hasCode} />
        <AuthButton />
      </div>
    </header>
  );
}
