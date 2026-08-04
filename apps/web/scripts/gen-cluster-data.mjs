#!/usr/bin/env node
/**
 * Generates cluster jewel data from PoB's Lua data files.
 * Sources:
 *   - ClusterJewels.lua: base types, small passive stats, enchants
 *   - ModJewelCluster.lua: which notables roll on which bases (weights)
 *   - TreeData/3_29/tree.json: actual notable stat descriptions
 *
 * Usage: node apps/web/scripts/gen-cluster-data.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POB_DATA = resolve(__dirname, "../public/data/pob/Data");
const TREE_JSON = resolve(__dirname, "../public/data/pob/TreeData/3_29/tree.json");
const OUTPUT = resolve(__dirname, "../data/cluster-data.generated.ts");

// --- Step 1: Parse ClusterJewels.lua ---

function parseClusterBases() {
  const text = readFileSync(resolve(POB_DATA, "ClusterJewels.lua"), "utf8");
  const lines = text.split("\n");
  const bases = [];

  let currentSize = null;
  let inSkills = false;
  let inSkill = false;
  let currentSkill = null;
  let collectingStats = false;
  let collectingEnchant = false;

  for (const line of lines) {
    const trimmed = line.trim();
    // Count leading tabs to determine depth
    const tabs = line.length - line.replace(/^\t+/, "").length;

    // Detect jewel size sections (depth 2)
    if (trimmed.includes('["Small Cluster Jewel"]')) currentSize = "small";
    else if (trimmed.includes('["Medium Cluster Jewel"]')) currentSize = "medium";
    else if (trimmed.includes('["Large Cluster Jewel"]')) currentSize = "large";

    // Detect skills block (depth 3)
    if (trimmed === "skills = {" && currentSize) {
      inSkills = true;
      continue;
    }

    if (!inSkills || !currentSize) continue;

    // End of skills section (depth 3 closing brace)
    if (tabs === 3 && trimmed === "},") {
      inSkills = false;
      currentSize = null;
      continue;
    }

    // Detect individual skill entry (depth 4): ["tag_name"] = {
    if (tabs === 4 && !inSkill) {
      const skillStart = trimmed.match(/^\["([^"]+)"\]\s*=\s*\{/);
      if (skillStart) {
        currentSkill = {
          id: skillStart[1],
          tag: "",
          name: "",
          type: currentSize,
          smallPassiveStats: [],
          enchantText: "",
          notablePool: [],
        };
        inSkill = true;
        continue;
      }
    }

    if (inSkill && currentSkill) {
      // End of skill entry (depth 4 closing brace)
      if (tabs === 4 && trimmed === "},") {
        if (!currentSkill.tag.startsWith("old_do_not_use_")) {
          bases.push(currentSkill);
        }
        currentSkill = null;
        inSkill = false;
        collectingStats = false;
        collectingEnchant = false;
        continue;
      }

      // Parse name
      const nameMatch = trimmed.match(/^name\s*=\s*"([^"]+)"/);
      if (nameMatch) currentSkill.name = nameMatch[1];

      // Parse tag
      const tagMatch = trimmed.match(/^tag\s*=\s*"([^"]+)"/);
      if (tagMatch) currentSkill.tag = tagMatch[1];

      // Parse stats block
      if (trimmed.startsWith("stats = {")) {
        collectingStats = true;
        const inlineStats = [...trimmed.matchAll(/"([^"]+)"/g)].map(m => m[1]);
        if (trimmed.endsWith("},")) {
          currentSkill.smallPassiveStats = inlineStats;
          collectingStats = false;
        }
        continue;
      }
      if (collectingStats) {
        if (trimmed.startsWith("}")) {
          collectingStats = false;
          continue;
        }
        const m = trimmed.match(/"([^"]+)"/);
        if (m) currentSkill.smallPassiveStats.push(m[1]);
        continue;
      }

      // Parse enchant block
      if (trimmed.startsWith("enchant = {")) {
        collectingEnchant = true;
        continue;
      }
      if (collectingEnchant) {
        if (trimmed.startsWith("}")) {
          collectingEnchant = false;
          continue;
        }
        const m = trimmed.match(/"([^"]+)"/);
        if (m && !currentSkill.enchantText) currentSkill.enchantText = m[1];
        continue;
      }
    }
  }

  return bases;
}

// --- Step 2: Parse ModJewelCluster.lua for notable mods ---

function parseNotableMods() {
  const text = readFileSync(resolve(POB_DATA, "ModJewelCluster.lua"), "utf8");
  const notables = new Map();

  const lines = text.split("\n").filter(l => l.trim().startsWith('["'));
  for (const line of lines) {
    // Extract notable name from "1 Added Passive Skill is <Name>"
    const statMatch = line.match(/"1 Added Passive Skill is ([^"]+)"/);
    if (!statMatch) continue;

    const name = statMatch[1];

    // Extract weightKey and weightVal
    const wkMatch = line.match(/weightKey\s*=\s*\{([^}]+)\}/);
    const wvMatch = line.match(/weightVal\s*=\s*\{([^}]+)\}/);
    if (!wkMatch || !wvMatch) continue;

    const keys = [...wkMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
    const vals = [...wvMatch[1].matchAll(/\d+/g)].map(m => parseInt(m[0]));

    const weights = {};
    for (let i = 0; i < keys.length && i < vals.length; i++) {
      if (vals[i] > 0 && keys[i] !== "default") {
        weights[keys[i]] = vals[i];
      }
    }

    // Extract level
    const levelMatch = line.match(/level\s*=\s*(\d+)/);
    const level = levelMatch ? parseInt(levelMatch[1]) : 1;

    // Keep the entry with the most weight assignments
    const existing = notables.get(name);
    if (!existing || Object.keys(weights).length > Object.keys(existing.weights).length) {
      notables.set(name, { name, weights, level });
    }
  }

  return [...notables.values()];
}

// --- Step 3: Load tree.json for notable stats ---

function loadNotableStats() {
  if (!existsSync(TREE_JSON)) {
    console.warn("  tree.json not found. Run convert-tree-lua.mjs first.");
    return {};
  }

  const treeData = JSON.parse(readFileSync(TREE_JSON, "utf8"));
  const stats = {};

  for (const [, node] of Object.entries(treeData.nodes || {})) {
    if (node.isNotable && node.name && node.stats?.length > 0) {
      if (!stats[node.name] || node.stats.length > stats[node.name].length) {
        stats[node.name] = node.stats;
      }
    }
  }

  return stats;
}

// --- Step 4: Cross-reference and generate ---

function main() {
  console.log("Parsing ClusterJewels.lua...");
  const bases = parseClusterBases();
  console.log(`  Found ${bases.length} cluster bases`);

  console.log("Parsing ModJewelCluster.lua...");
  const mods = parseNotableMods();
  console.log(`  Found ${mods.length} unique notable mods`);

  console.log("Loading tree.json...");
  const notableStats = loadNotableStats();
  console.log(`  Found stats for ${Object.keys(notableStats).length} notables`);

  // Cross-reference: assign notables to bases
  for (const base of bases) {
    for (const mod of mods) {
      if (mod.weights[base.tag] > 0) {
        base.notablePool.push(mod.name);
      }
    }
  }

  // Build notable data
  const notableData = {};
  for (const mod of mods) {
    notableData[mod.name] = {
      name: mod.name,
      stats: notableStats[mod.name] || [],
      weights: mod.weights,
      level: mod.level,
    };
  }

  // Report
  const basesWithNotables = bases.filter(b => b.notablePool.length > 0);
  console.log(`\nResults:`);
  console.log(`  ${bases.length} total bases (${basesWithNotables.length} with notables)`);
  console.log(`  ${Object.keys(notableData).length} unique notables`);

  // Verify cold damage
  const coldBase = bases.find(b => b.tag === "affliction_cold_damage");
  if (coldBase) {
    console.log(`\n  Cold Damage (${coldBase.type}) - ${coldBase.notablePool.length} notables:`);
    for (const n of coldBase.notablePool) {
      const s = notableData[n]?.stats?.join("; ") || "(no stats)";
      const w = notableData[n]?.weights[coldBase.tag] || 0;
      console.log(`    - ${n} (w:${w}): ${s}`);
    }
  }

  // Check Doryani's Lesson should NOT be on cold
  if (coldBase?.notablePool.includes("Doryani's Lesson")) {
    console.log(`\n  WARNING: Doryani's Lesson is on Cold Damage base (incorrect?)`);
  } else {
    console.log(`\n  OK: Doryani's Lesson NOT on Cold Damage base`);
  }

  // Check Precise Commander
  const pc = notableData["Precise Commander"];
  if (pc) {
    console.log(`\n  Precise Commander stats: ${pc.stats.join("; ")}`);
    console.log(`    Weights: ${JSON.stringify(pc.weights)}`);
  }

  // Generate TypeScript
  const ts = [
    "// AUTO-GENERATED from PoB data files. Do not edit manually.",
    "// Source: ClusterJewels.lua + ModJewelCluster.lua + tree.json",
    `// Generated: ${new Date().toISOString()}`,
    "// Run: node apps/web/scripts/gen-cluster-data.mjs",
    "",
    "export interface ClusterBaseData {",
    "  name: string;",
    "  tag: string;",
    '  type: "large" | "medium" | "small";',
    "  smallPassiveStats: string[];",
    "  enchantText: string;",
    "  notablePool: string[];",
    "}",
    "",
    "export interface ClusterNotableData {",
    "  name: string;",
    "  stats: string[];",
    "  weights: Record<string, number>;",
    "  level: number;",
    "}",
    "",
    `export const CLUSTER_BASES: ClusterBaseData[] = ${JSON.stringify(bases, null, 2)};`,
    "",
    `export const CLUSTER_NOTABLES: Record<string, ClusterNotableData> = ${JSON.stringify(notableData, null, 2)};`,
    "",
  ];

  writeFileSync(OUTPUT, ts.join("\n"));
  console.log(`\nWrote ${OUTPUT} (${(ts.join("\n").length / 1024).toFixed(0)} KB)`);
}

main();
