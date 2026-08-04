"use client";

import { useState } from "react";

interface NinjaBuild {
  account: string;
  character: string;
  class: string;
  level: number;
  life: number;
  energyShield: number;
  depth: number;
}

const CLASSES = [
  "All",
  "Marauder",
  "Ranger",
  "Witch",
  "Duelist",
  "Templar",
  "Shadow",
  "Scion",
];

const CLASS_COLORS: Record<string, string> = {
  Marauder: "#c44",
  Witch: "#44c",
  Ranger: "#4c4",
  Duelist: "#c84",
  Templar: "#cc4",
  Shadow: "#8c4",
  Scion: "#ccc",
};

export function NinjaBuilds() {
  const [builds, setBuilds] = useState<NinjaBuild[]>([]);
  const [loading, setLoading] = useState(false);
  const [classFilter, setClassFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchBuilds = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type: "builds" });
      if (classFilter) params.set("class", classFilter);
      const resp = await fetch(`/api/ninja?${params}`);
      const data = await resp.json();
      if (data.error) {
        setError(data.error);
      } else {
        setBuilds(data.builds || []);
      }
    } catch {
      setError("Failed to fetch ladder data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text-dim">
          poe.ninja Ladder
        </h2>
        <button
          onClick={fetchBuilds}
          disabled={loading}
          className="text-[10px] font-mono px-3 py-1 rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-40 transition-colors"
        >
          {loading ? "Loading..." : "Load Ladder"}
        </button>
      </div>

      <div className="flex gap-1 mb-3 flex-wrap">
        {CLASSES.map((c) => (
          <button
            key={c}
            onClick={() => setClassFilter(c === "All" ? "" : c)}
            className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
              (c === "All" && !classFilter) || classFilter === c
                ? "bg-accent/20 text-accent border border-accent/30"
                : "text-text-dim hover:text-text-primary border border-transparent"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-xs font-mono text-blood/80 bg-blood/10 rounded px-3 py-2 mb-3">
          {error}
        </div>
      )}

      {builds.length > 0 && (
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {builds.map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2 bg-bg-card border border-border-card rounded text-xs font-mono hover:border-accent/20 transition-colors"
            >
              <span className="text-text-dim/40 w-5 text-right tabular-nums shrink-0">
                {i + 1}
              </span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: CLASS_COLORS[b.class] || "#888",
                }}
              />
              <span className="text-text-primary flex-1 truncate">
                {b.character}
              </span>
              <span className="text-text-dim shrink-0">{b.class}</span>
              <span className="text-text-dim shrink-0">Lv {b.level}</span>
              {b.life > 0 && (
                <span className="text-life tabular-nums shrink-0">
                  {b.life}
                </span>
              )}
              {b.energyShield > 0 && (
                <span className="text-es tabular-nums shrink-0">
                  {b.energyShield}
                </span>
              )}
              {b.depth > 0 && (
                <span className="text-text-dim/60 shrink-0">D{b.depth}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {builds.length === 0 && !loading && !error && (
        <p className="text-xs font-mono text-text-dim/60 text-center py-8">
          Click Load Ladder to fetch top builds from poe.ninja.
        </p>
      )}
    </div>
  );
}
