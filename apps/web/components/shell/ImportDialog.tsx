"use client";

import { useState, useRef, useEffect } from "react";
import { useBuildStore } from "@/stores/build-store";
import { BuildCard } from "./BuildCard";
import { GuideViewer } from "@/components/guide/GuideViewer";
import { ALL_GUIDES } from "@/data/guides";

interface PoECharacter {
  name: string;
  class: string;
  level: number;
  league: string;
}

export function ImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [importScope, setImportScope] = useState<"full" | "tree" | "items" | "skills">("full");
  const [mode, setMode] = useState<"code" | "account" | "guide">("code");
  const [accountName, setAccountName] = useState("");
  const [characters, setCharacters] = useState<PoECharacter[]>([]);
  const [fetchingChars, setFetchingChars] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { importBuild, loading, error, savedBuilds, loadSavedBuilds, deleteSavedBuild } = useBuildStore();

  useEffect(() => {
    if (open) {
      loadSavedBuilds();
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open, loadSavedBuilds]);

  if (!open) return null;

  const handleImport = async () => {
    if (!input.trim()) return;
    await importBuild(input.trim());
    if (!useBuildStore.getState().error) {
      setInput("");
      onClose();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.length > 100) {
      e.preventDefault();
      setInput(pasted);
      setTimeout(() => {
        importBuild(pasted.trim()).then(() => {
          if (!useBuildStore.getState().error) {
            setInput("");
            onClose();
          }
        });
      }, 50);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-bg-card border border-border-card rounded-lg shadow-2xl w-full max-w-lg mx-4 p-5" role="dialog" aria-modal="true" aria-labelledby="import-dialog-title">
        <div className="flex items-center justify-between mb-4">
          <h2 id="import-dialog-title" className="text-text-heading font-display text-lg">
            Import Build
          </h2>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text-primary text-xl leading-none px-1"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setMode("code")}
            className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors ${
              mode === "code" ? "bg-accent/20 text-accent" : "text-text-dim hover:text-text-primary"
            }`}
          >
            Code / URL
          </button>
          <button
            onClick={() => setMode("account")}
            className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors ${
              mode === "account" ? "bg-accent/20 text-accent" : "text-text-dim hover:text-text-primary"
            }`}
          >
            PoE Account
          </button>
          <button
            onClick={() => setMode("guide")}
            className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors ${
              mode === "guide" ? "bg-accent/20 text-accent" : "text-text-dim hover:text-text-primary"
            }`}
          >
            Guides
          </button>
        </div>

        {mode === "account" && (
          <div className="mb-3">
            <div className="flex gap-2 mb-3">
              <input
                value={accountName}
                onChange={(e) => { setAccountName(e.target.value); setAccountError(null); }}
                onKeyDown={(e) => e.key === "Enter" && document.getElementById("fetch-chars-btn")?.click()}
                placeholder="Account name..."
                className="flex-1 bg-bg-inset border border-border-subtle rounded px-3 py-1.5 text-sm font-mono text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent"
              />
              <button
                id="fetch-chars-btn"
                onClick={async () => {
                  if (!accountName.trim()) return;
                  setFetchingChars(true);
                  setAccountError(null);
                  try {
                    const resp = await fetch(`/api/character?account=${encodeURIComponent(accountName.trim())}`);
                    const data = await resp.json();
                    if (data.error) {
                      setAccountError(data.error);
                    } else if (data.characters) {
                      setCharacters(data.characters);
                    }
                  } catch {
                    setAccountError("Failed to fetch characters");
                  } finally {
                    setFetchingChars(false);
                  }
                }}
                disabled={fetchingChars || !accountName.trim()}
                className="px-3 py-1.5 text-sm font-mono bg-accent/20 text-accent rounded border border-accent/30 hover:bg-accent/30 disabled:opacity-40 transition-colors"
              >
                {fetchingChars ? "..." : "Fetch"}
              </button>
            </div>
            {accountError && (
              <div className="text-blood text-xs font-mono mb-2">{accountError}</div>
            )}
            {characters.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {characters.map((char) => (
                  <button
                    key={char.name}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-mono rounded hover:bg-bg-hover transition-colors"
                    onClick={async () => {
                      setAccountError(null);
                      setFetchingChars(true);
                      try {
                        const resp = await fetch(`/api/character?account=${encodeURIComponent(accountName)}&character=${encodeURIComponent(char.name)}`);
                        const data = await resp.json();
                        if (data.error) { setAccountError(data.error); return; }
                        const { convertCharacterToXml } = await import("@/lib/character-converter");
                        const xml = convertCharacterToXml(char, data.items || { items: [] }, data.passives || { hashes: [] });
                        await importBuild(xml);
                        if (!useBuildStore.getState().error) { setInput(""); onClose(); }
                      } catch { setAccountError("Failed to import character"); }
                      finally { setFetchingChars(false); }
                    }}
                  >
                    <span className="text-text-primary">{char.name}</span>
                    <span className="text-text-dim">{char.class}</span>
                    <span className="text-text-dim ml-auto">Lv {char.level}</span>
                    <span className="text-text-dim/60">{char.league}</span>
                  </button>
                ))}
              </div>
            )}
            {characters.length === 0 && !fetchingChars && (
              <p className="text-xs font-mono text-text-dim/60 text-center py-4">
                Enter your PoE account name and click Fetch. Profile must be public.
              </p>
            )}
          </div>
        )}

        {mode === "guide" && (
          <div className="max-h-96 overflow-y-auto space-y-4">
            {ALL_GUIDES.map((guide, i) => (
              <GuideViewer
                key={i}
                guide={guide}
                onImport={(code) => {
                  importBuild(code);
                  onClose();
                }}
              />
            ))}
            {ALL_GUIDES.length === 0 && (
              <p className="text-xs font-mono text-text-dim/60 text-center py-6">
                No guides available yet. Check back soon.
              </p>
            )}
          </div>
        )}

        {mode === "code" && <p className="text-text-dim text-xs font-mono mb-3">
          Paste a PoB build code, pastebin URL, or pobb.in link
        </p>}

        {mode === "code" && <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => setInput(reader.result as string);
              reader.readAsText(file);
            }
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            placeholder="Paste your build code here..."
            className="w-full h-32 bg-bg-inset border border-border-subtle rounded px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-dim/40 resize-none focus:outline-none focus:border-accent"
            disabled={loading}
          />
          <div className="mt-2 text-center">
            <label className="text-[10px] font-mono text-text-dim cursor-pointer hover:text-accent transition-colors">
              or <span className="underline">upload a .xml file</span>
              <input
                type="file"
                accept=".xml,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setInput(reader.result as string);
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>
        </div>}

        {mode === "code" && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-mono text-text-dim">Import:</span>
            {(["full", "tree", "items", "skills"] as const).map((scope) => (
              <button
                key={scope}
                onClick={() => {
                  setImportScope(scope);
                  useBuildStore.getState().setImportScope(scope);
                }}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                  importScope === scope
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "text-text-dim hover:text-text-primary border border-transparent"
                }`}
              >
                {scope === "full" ? "Full Build" : scope.charAt(0).toUpperCase() + scope.slice(1)}
              </button>
            ))}
          </div>
        )}

        {mode === "code" && !input.trim() && savedBuilds.length === 0 && (
          <div className="mt-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-dim">
              Quick Start
            </span>
            <div className="mt-1.5 grid grid-cols-1 gap-1.5">
              {[
                { name: "RF Juggernaut", desc: "Tanky regen tank", code: "eJytU9tOwzAM_ZUoH8DKEEiTuk4MNgQaF63AKzKtV6KlyUicwf4eN1uhQ4IXeEninONzLMdJR--1Fmt0XlkzlIcHiRxl6R3Qy-1iHJQulamyNJ6ExjXqoRwkUhC4CumxTTt64rtCg_c3UONQXoODUKKTAnyBpjz7gq5CVaEzEEiKGpTJbbFEunA2rNheirXCt2tbMvN-PplIrkXDBl1OQMLzMpQztUDmgQ5MOjlOEtnL0l4sMUvzpdLaCyhIrTEGOVIjvIM4EqrsXMQiTr_osQg08KyRaeQCe3ltWWNsy404dbUNjpMvsG4b0ueM1wBa0YYD7oRvhC45fa6qF0Ib_FQ51jHcgXyFRQcQW2TfsLcvn_wkn4fVyjoaB2f4mc6hhmrPZQeILSJ29D-6TTTWaAj01BbBd-0-ERGhf_I7s4ZHiBwQlpPFAgvqenZRsYV_8e3FJ253noX26LP03iG2cxOl44jwSRAjnVHvDxh4mM84d7s2JN4agSy9JKx9Y_XtD30A5aYoUg==" },
                { name: "LA Deadeye", desc: "Fast bow mapper", code: "eJytU8tOwzAQ_BXLH0BLOVVKU6UPVZXKQ02BIzLxklj1I9hOSv-ejZvQFAkucIl3d2Znssk6mn4oSWqwThg9oddXQzqNowfmi_u3WSUkFzqPoxARCTXICR0PKfHM5uCfurabF6xlkjl3xxRM6JbpHCwlzGWg-fwMLIBxOAIligmdmmwPfmVNVaIzJbWAw63hSNttl0s6iKN0L6R0hGVe1BCSFHzDbSHMiOC9QtBNzvSgC5q9SkCatxVaO2lQY2b4kSRWmcpi8wpUN94IO94rJoU_YoJzuUZoje0bkRde4wdJrDUHSjSOlJaQ9RDSQpeWg0uD4U8GaVWWxvp5gUP05UOBtOgfxRPOgc-N5AumWA59mwCRBiMn8J8slxIUaM_kSfVZ-CLxnmV713f_YnXmB-SRlvjLmwzCj-5O3IgudHG0swDd9gSTsCgYEY9Ib31HYwQetxvsPT0bEh6NQBytPSjXWH27F58gcBiT" },
                { name: "SRS Necromancer", desc: "Minion summoner", code: "eJytU9tOAjEQ_ZVJP0AQn0iWJaCEkAgaFvTR1O4IDb2sbXeRv3f2JouJvuhLOzPnzJxOO43GH1pBgc5La0bs-qrPxnH0yMP-4W2aS5VKs4ujygKFBaoRG_YZBO52GJ7atJsXignFvV9xjSP2LIPYM-BeoElvz_EVCmc1NwIdA82lSaw4YJg7m2ckzqCQeFzalKib9WzGenGUHKRSHrgIssDKSTCU3AYiD2TaCVR1J2d6VRcNf1VItOByZOCVpRpTm55g4rTNHSXPUbcdDijjPedKhhM51JovCy0oPcm1tmbNd3QtSSadDAwMtZZkKFoUahha_FK7d6nU_1kpy6wLS2nohu-45jvsStVxqAFoyH_U2hqF3O-7Mk3onwRmCjWawFV9bJqS_SQELg6-q_nFabs7Eg8a4i8n6VXP3e40F63p42jjENsZqkSqcSELAiGdOR4MCdiu7ym3XksSbWWBOFoE1L6U-vZBPgEODB07" },
              ].map((build) => (
                <button
                  key={build.name}
                  onClick={() => {
                    importBuild(build.code).then(() => {
                      if (!useBuildStore.getState().error) {
                        setInput("");
                        onClose();
                      }
                    });
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-left rounded border border-border-subtle hover:border-accent/30 hover:bg-bg-hover/50 transition-colors"
                >
                  <span className="text-xs font-mono text-text-primary">{build.name}</span>
                  <span className="text-[10px] font-mono text-text-dim flex-1">{build.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {savedBuilds.length > 0 && (
          <div className="mt-3 border-t border-border-subtle pt-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-dim">
              Saved Builds
            </span>
            <div className="mt-1.5 space-y-1 max-h-40 overflow-y-auto">
              {savedBuilds.map((build, i) => (
                <BuildCard
                  key={i}
                  name={build.name}
                  className={build.className}
                  ascendancy={build.ascendancy}
                  level={build.level}
                  compact
                  onClick={() => {
                    importBuild(build.code).then(() => {
                      if (!useBuildStore.getState().error) {
                        setInput("");
                        onClose();
                      }
                    });
                  }}
                  onDelete={() => deleteSavedBuild(i)}
                />
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-3">
            <div className="w-full h-1 bg-bg-inset rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-mono text-text-dim">
                {input.includes("pobb.in") || input.includes("pastebin")
                  ? "Fetching from URL..."
                  : "Decoding build..."}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-2 text-blood text-xs font-mono">{error}</div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-mono text-text-dim hover:text-text-primary rounded border border-border-subtle hover:border-border-card transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !input.trim()}
            className="px-4 py-1.5 text-sm font-mono bg-accent/20 text-accent rounded border border-accent/30 hover:bg-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
