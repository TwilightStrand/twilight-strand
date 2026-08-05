"use client";

import { useState, useMemo } from "react";
import { useBuildStore } from "@/stores/build-store";
import { useTreeStore } from "@/stores/tree-store";

interface TimelessResult {
  jewel: string;
  conqueror: string;
  keystone: string;
  keystoneEffect: string;
  nearbyNotables: number;
  estimatedBenefit: string;
}

const TIMELESS_JEWELS = [
  {
    name: "Lethal Pride",
    type: "Karui",
    conquerors: ["Kaom", "Rakiata", "Kiloava", "Akoya"],
    keystones: {
      Kaom: { name: "Strength of Blood", effect: "Life recovery from flasks also recovers ES" },
      Rakiata: { name: "Tempered by War", effect: "50% of cold/lightning damage taken as fire, -50% cold/lightning res" },
      Kiloava: { name: "Glancing Blows", effect: "Double block chance, take 65% of damage on block" },
      Akoya: { name: "Chainbreaker", effect: "Gain rage on hit, rage degenerates, rage scales attack damage" },
    },
    smallMods: [
      "5% increased Strength",
      "+20 to Strength",
      "4% increased maximum Life",
      "2% increased Fire Damage",
      "5% increased Melee Damage",
      "10% increased Armour",
      "4% increased Physical Damage",
    ],
  },
  {
    name: "Brutal Restraint",
    type: "Maraketh",
    conquerors: ["Deshret", "Balbala", "Asenath", "Nasima"],
    keystones: {
      Deshret: { name: "Wind Dancer", effect: "40% less attack damage taken if hit recently, 20% more if not" },
      Balbala: { name: "The Traitor", effect: "Flasks gain charges every 5s, no charges on kill" },
      Asenath: { name: "Dance with Death", effect: "Can't use helmets, crits deal triple damage" },
      Nasima: { name: "Second Sight", effect: "Blind while not blinded, 25% more damage while blinded" },
    },
    smallMods: [
      "5% increased Dexterity",
      "+20 to Dexterity",
      "4% increased Evasion Rating",
      "15% increased Critical Strike Chance",
      "5% increased Movement Speed",
      "4% increased Attack Speed",
    ],
  },
  {
    name: "Militant Faith",
    type: "Templar",
    conquerors: ["Avarius", "Dominus", "Maxarius", "Venarius"],
    keystones: {
      Avarius: { name: "Power of Purpose", effect: "Mana provides armour instead of being spent" },
      Dominus: { name: "Inner Conviction", effect: "+3% more spell damage per power charge, no frenzy charges" },
      Maxarius: { name: "Transcendence", effect: "Armour applies to elemental damage, not physical" },
      Venarius: { name: "Battlemage", effect: "Weapon damage added to spells" },
    },
    smallMods: [
      "+10 to Devotion",
      "4% increased effect of non-damaging ailments",
      "5% increased Area of Effect",
      "4% increased elemental damage",
    ],
  },
  {
    name: "Elegant Hubris",
    type: "Eternal Empire",
    conquerors: ["Cadiro", "Victario", "Caspiro", "Chitus"],
    keystones: {
      Cadiro: { name: "Supreme Decadence", effect: "Life flasks also apply to ES" },
      Victario: { name: "Supreme Grandstanding", effect: "Enemies taunted by you deal less damage" },
      Caspiro: { name: "Supreme Ego", effect: "50% more effect of non-curse auras, can only affect you" },
      Chitus: { name: "Supreme Ostentation", effect: "Ignore attribute requirements" },
    },
    smallMods: [
      "80% increased Effect",
      "Replaces all passives in radius",
    ],
  },
  {
    name: "Glorious Vanity",
    type: "Vaal",
    conquerors: ["Xibaqua", "Zerphi", "Ahuana", "Doryani"],
    keystones: {
      Xibaqua: { name: "Divine Flesh", effect: "50% of elemental damage taken as chaos, +10% max chaos res" },
      Zerphi: { name: "Corrupted Soul", effect: "50% of non-chaos damage bypasses ES, gain 20% of max life as ES" },
      Ahuana: { name: "Immortal Ambition", effect: "ES recharge applies to life, cannot recharge ES" },
      Doryani: { name: "Coruscating Elixir", effect: "Chaos damage bypasses ES, life flasks remove all but 1 life" },
    },
    smallMods: [
      "Transforms nearby passives to Vaal-themed",
      "Replaces with chaos/life/ES modifiers",
    ],
  },
];

export function TimelessSearch() {
  const stats = useBuildStore((s) => s.stats);
  const allocatedNodes = useTreeStore((s) => s.allocatedNodes);
  const [selectedJewel, setSelectedJewel] = useState(0);
  const [results, setResults] = useState<TimelessResult[]>([]);
  const [searching, setSearching] = useState(false);

  const jewel = TIMELESS_JEWELS[selectedJewel];

  const search = async () => {
    if (!stats || !jewel) return;
    setSearching(true);

    try {
      const treeResp = await fetch("/data/pob/TreeData/3_29/tree.json");
      const treeData = await treeResp.json();
      const nodes = treeData.nodes as Record<string, Record<string, unknown>>;

      // Build adjacency map for graph-distance radius
      const adj = new Map<string, string[]>();
      for (const [nid, n] of Object.entries(nodes)) {
        if (nid === "root") continue;
        const outs = ((n.out || []) as (string | number)[]).map(String);
        const ins = ((n.in || []) as (string | number)[]).map(String);
        const all = [...new Set([...outs, ...ins])];
        adj.set(nid, [...new Set([...(adj.get(nid) || []), ...all])]);
        for (const nb of all) {
          const ex = adj.get(nb) || [];
          if (!ex.includes(nid)) adj.set(nb, [...ex, nid]);
        }
      }

      // BFS to find nodes within N hops of a jewel socket (timeless radius ~40 nodes)
      const JEWEL_RADIUS = 15;
      function nodesInRadius(socketId: string): Set<string> {
        const visited = new Set<string>();
        const queue: [string, number][] = [[socketId, 0]];
        visited.add(socketId);
        while (queue.length > 0) {
          const [cur, depth] = queue.shift()!;
          if (depth >= JEWEL_RADIUS) continue;
          for (const nb of adj.get(cur) || []) {
            if (!visited.has(nb)) {
              visited.add(nb);
              queue.push([nb, depth + 1]);
            }
          }
        }
        return visited;
      }

      // Find jewel sockets in the tree
      const jewelSockets = Object.entries(nodes)
        .filter(([, n]) => n.isJewelSocket)
        .map(([id]) => id);

      // For each conqueror, show the keystone it grants
      const r: TimelessResult[] = [];
      for (const conqueror of jewel.conquerors) {
        const ks = (jewel.keystones as unknown as Record<string, { name: string; effect: string }>)[conqueror];

        // Count allocated notables within graph-distance radius of each jewel socket
        let bestSocket = 0;
        for (const socketId of jewelSockets) {
          if (!allocatedNodes.has(socketId)) continue;
          const radius = nodesInRadius(socketId);
          let nearby = 0;
          for (const nodeId of allocatedNodes) {
            if (!radius.has(nodeId)) continue;
            const n = nodes[nodeId];
            if (n && (n.isNotable || n.isKeystone)) nearby++;
          }
          bestSocket = Math.max(bestSocket, nearby);
        }

        r.push({
          jewel: jewel.name,
          conqueror,
          keystone: ks?.name || "Unknown",
          keystoneEffect: ks?.effect || "",
          nearbyNotables: bestSocket,
          estimatedBenefit: bestSocket > 3
            ? "High - many notables in radius"
            : bestSocket > 1
              ? "Medium - some notables transformed"
              : "Low - few allocated nodes nearby",
        });
      }

      setResults(r);
    } catch (e) {
      console.warn("Timeless search error:", e);
    } finally {
      setSearching(false);
    }
  };

  if (!stats) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text-dim">
          Timeless Jewel Search
        </h2>
        <div className="flex items-center gap-1.5">
          <select
            value={selectedJewel}
            onChange={(e) => {
              setSelectedJewel(parseInt(e.target.value));
              setResults([]);
            }}
            className="bg-bg-inset border border-border-subtle rounded px-1.5 py-0.5 text-[10px] font-mono text-text-primary"
          >
            {TIMELESS_JEWELS.map((j, i) => (
              <option key={i} value={i}>
                {j.name} ({j.type})
              </option>
            ))}
          </select>
          <button
            onClick={search}
            disabled={searching}
            className="text-[10px] font-mono px-3 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-40"
          >
            {searching ? "..." : "Analyze"}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-w-2xl">
          {results.map((r, i) => (
            <div
              key={i}
              className="px-3 py-2 bg-bg-card border border-border-card rounded text-[10px] font-mono"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-text-primary font-bold">
                  {r.conqueror}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded ${
                    r.nearbyNotables > 3
                      ? "bg-green-400/10 text-green-400"
                      : r.nearbyNotables > 1
                        ? "bg-amber-400/10 text-amber-400"
                        : "bg-text-dim/10 text-text-dim"
                  }`}
                >
                  {r.estimatedBenefit}
                </span>
              </div>
              <div className="text-accent mb-0.5">
                Keystone: {r.keystone}
              </div>
              <div className="text-text-dim/70 text-[9px] leading-tight">
                {r.keystoneEffect}
              </div>
              <div className="text-text-dim/40 text-[9px] mt-1">
                {r.nearbyNotables} allocated notables in radius
              </div>
            </div>
          ))}

          <div className="mt-3">
            <h4 className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-dim/60 mb-1">
              Small Passive Bonuses ({jewel.type})
            </h4>
            <div className="text-[9px] font-mono text-text-dim/50 space-y-0.5">
              {jewel.smallMods.map((m, i) => (
                <div key={i}>{m}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {results.length === 0 && !searching && (
        <p className="text-xs font-mono text-text-dim/60 text-center py-6">
          Analyzes timeless jewel conqueror keystones and counts allocated
          notables in radius for each jewel socket. Select a jewel type and click Analyze.
        </p>
      )}
    </div>
  );
}
