"use client";

const CHANGELOG = [
  {
    version: "0.1.0",
    date: "2026-08-04",
    changes: [
      "Full PoB engine running in browser via WebAssembly",
      "Import from PoB code, pobb.in, pastebin, XML file, PoE account",
      "Real DPS, defence, and resistance calculations",
      "Interactive passive tree with search, tooltips, and allocation",
      "Items, skills, config, and calcs tabs",
      "Dark/light theme, keyboard shortcuts, PWA offline support",
      "Build comparison, local saves, shareable URLs",
      "Docker deployment support",
    ],
  },
];

export function Changelog() {
  return (
    <div>
      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-text-dim mb-2">
        Changelog
      </h3>
      <div className="space-y-3">
        {CHANGELOG.map((release) => (
          <div key={release.version} className="bg-bg-card border border-border-card rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-accent">v{release.version}</span>
              <span className="text-[10px] font-mono text-text-dim">{release.date}</span>
            </div>
            <ul className="space-y-0.5">
              {release.changes.map((change, i) => (
                <li key={i} className="text-[10px] font-mono text-text-dim flex gap-1.5">
                  <span className="text-accent/40 shrink-0">-</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
