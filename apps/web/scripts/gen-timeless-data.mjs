#!/usr/bin/env node
/**
 * Generates timeless jewel data from PoB's Lua data files.
 * Sources:
 *   - Data/TimelessJewelData/LegionPassives.lua -> timeless-passives.json
 *   - Data/TimelessJewelData/NodeIndexMapping.lua -> timeless-node-index.json
 *
 * Usage: node apps/web/scripts/gen-timeless-data.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POB_DATA = process.env.POB_DATA || resolve(__dirname, "../public/data/pob/Data");
const TIMELESS_DIR = resolve(POB_DATA, "TimelessJewelData");
const ENGINE_DATA_DIR = resolve(__dirname, "../../../packages/engine/data");

// ---------------------------------------------------------------------------
// Generic Lua table helpers
// ---------------------------------------------------------------------------

/**
 * Given a Lua text and an opening brace position, returns the index of the
 * matching closing brace.
 */
function findMatchingBrace(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Extracts a substring starting at the opening `{` through the matching `}`.
 */
function extractBlock(text, openIdx) {
  const end = findMatchingBrace(text, openIdx);
  if (end === -1) return null;
  return text.substring(openIdx, end + 1);
}

// ---------------------------------------------------------------------------
// LegionPassives.lua parser
// ---------------------------------------------------------------------------

/**
 * Parse a single stat entry from its Lua block text:
 *   ["stat_id"] = { ["fmt"] = "d", ["index"] = 1, ["max"] = 12, ["min"] = 7, ["statOrder"] = 1384, }
 */
function parseStat(block) {
  const fmt = block.match(/\["fmt"\]\s*=\s*"([^"]+)"/)?.[1] ?? "d";
  const index = Number(block.match(/\["index"\]\s*=\s*(\d+)/)?.[1] ?? 0);
  const max = Number(block.match(/\["max"\]\s*=\s*(-?\d+)/)?.[1] ?? 0);
  const min = Number(block.match(/\["min"\]\s*=\s*(-?\d+)/)?.[1] ?? 0);
  const statOrder = Number(
    block.match(/\["statOrder"\]\s*=\s*(\d+)/)?.[1] ?? 0
  );
  return { fmt, index, max, min, statOrder };
}

/**
 * Parse the stats table: { ["stat_id"] = { ... }, ["stat_id2"] = { ... } }
 */
function parseStatsTable(block) {
  const stats = {};
  const re = /\["([^"]+)"\]\s*=\s*\{/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    const statId = m[1];
    const inner = extractBlock(block, m.index + m[0].length - 1);
    if (inner) {
      stats[statId] = parseStat(inner);
    }
  }
  return stats;
}

/**
 * Parse a Lua indexed string array: { [1] = "foo", [2] = "bar" }
 * Returns a JS array preserving the Lua 1-based order.
 */
function parseStringArray(block) {
  const entries = [];
  const re = /\[(\d+)\]\s*=\s*"([^"]*(?:\\.[^"]*)*)"/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    const idx = Number(m[1]) - 1; // Lua 1-based -> JS 0-based
    entries[idx] = m[2];
  }
  return entries.filter((s) => s !== undefined);
}

/**
 * Parse an addition entry (inside the additions table).
 * Returns: { id, dn, sd[], sortedStats[], stats{} }
 */
function parseAddition(block) {
  const id = block.match(/\["id"\]\s*=\s*"([^"]+)"/)?.[1] ?? "";
  const dn = block.match(/\["dn"\]\s*=\s*"([^"]+)"/)?.[1] ?? "";

  // sd array
  const sdMatch = block.match(/\["sd"\]\s*=\s*\{/);
  let sd = [];
  if (sdMatch) {
    const sdBlock = extractBlock(block, sdMatch.index + sdMatch[0].length - 1);
    if (sdBlock) sd = parseStringArray(sdBlock);
  }

  // sortedStats array
  const ssMatch = block.match(/\["sortedStats"\]\s*=\s*\{/);
  let sortedStats = [];
  if (ssMatch) {
    const ssBlock = extractBlock(block, ssMatch.index + ssMatch[0].length - 1);
    if (ssBlock) sortedStats = parseStringArray(ssBlock);
  }

  // stats table
  const stMatch = block.match(/\["stats"\]\s*=\s*\{/);
  let stats = {};
  if (stMatch) {
    const stBlock = extractBlock(block, stMatch.index + stMatch[0].length - 1);
    if (stBlock) stats = parseStatsTable(stBlock);
  }

  return { id, dn, sd, sortedStats, stats };
}

/**
 * Parse a node entry (inside the nodes table).
 * Nodes have more fields than additions; we keep the calc-relevant ones.
 */
function parseNode(block) {
  const base = parseAddition(block);

  const ks = /\["ks"\]\s*=\s*true/.test(block);
  const not_ = /\["not"\]\s*=\s*true/.test(block);
  const m = /\["m"\]\s*=\s*true/.test(block);

  return { ...base, ks, not: not_, m };
}

function parseLegionPassives() {
  const text = readFileSync(
    resolve(TIMELESS_DIR, "LegionPassives.lua"),
    "utf8"
  );

  // --- Parse additions ---
  const additionsStart = text.indexOf('["additions"] = {');
  if (additionsStart === -1) throw new Error("Could not find additions table");

  const additionsBrace = text.indexOf("{", additionsStart + 15);
  const additionsBlock = extractBlock(text, additionsBrace);
  if (!additionsBlock) throw new Error("Could not extract additions block");

  const additions = [];
  const addRe = /\[(\d+)\]\s*=\s*\{/g;
  let addMatch;
  while ((addMatch = addRe.exec(additionsBlock)) !== null) {
    const idx = Number(addMatch[1]);
    const inner = extractBlock(
      additionsBlock,
      addMatch.index + addMatch[0].length - 1
    );
    if (!inner) continue;

    // Skip nested indexed entries (sd, sortedStats sub-arrays match [N] too)
    // Only take entries whose id field exists (top-level addition entries)
    if (!inner.includes('["id"]')) continue;

    additions[idx - 1] = parseAddition(inner);
  }

  // --- Parse nodes ---
  const nodesStart = text.indexOf('["nodes"] = {');
  if (nodesStart === -1) throw new Error("Could not find nodes table");

  const nodesBrace = text.indexOf("{", nodesStart + 11);
  const nodesBlock = extractBlock(text, nodesBrace);
  if (!nodesBlock) throw new Error("Could not extract nodes block");

  const nodes = [];
  const nodeRe = /\[(\d+)\]\s*=\s*\{/g;
  let nodeMatch;
  while ((nodeMatch = nodeRe.exec(nodesBlock)) !== null) {
    const idx = Number(nodeMatch[1]);
    const inner = extractBlock(
      nodesBlock,
      nodeMatch.index + nodeMatch[0].length - 1
    );
    if (!inner) continue;

    if (!inner.includes('["id"]')) continue;

    nodes[idx - 1] = parseNode(inner);
  }

  return {
    additions: additions.filter(Boolean),
    nodes: nodes.filter(Boolean),
  };
}

// ---------------------------------------------------------------------------
// NodeIndexMapping.lua parser
// ---------------------------------------------------------------------------

function parseNodeIndexMapping() {
  const text = readFileSync(
    resolve(TIMELESS_DIR, "NodeIndexMapping.lua"),
    "utf8"
  );
  const lines = text.split("\n");

  let size = 0;
  let sizeNotable = 0;
  const nodeIdToIndex = {};
  const localIdToGlobalId = {};

  for (const line of lines) {
    const trimmed = line.trim();

    // nodeIDList["size"] = 1937
    const sizeMatch = trimmed.match(/^nodeIDList\["size"\]\s*=\s*(\d+)/);
    if (sizeMatch) {
      size = Number(sizeMatch[1]);
      continue;
    }

    // nodeIDList["sizeNotable"] = 454
    const sizeNotableMatch = trimmed.match(
      /^nodeIDList\["sizeNotable"\]\s*=\s*(\d+)/
    );
    if (sizeNotableMatch) {
      sizeNotable = Number(sizeNotableMatch[1]);
      continue;
    }

    // nodeIDList[6] = { index = 0, size = 28419 }
    const nodeMatch = trimmed.match(
      /^nodeIDList\[(\d+)\]\s*=\s*\{\s*index\s*=\s*(\d+)\s*,\s*size\s*=\s*(\d+)\s*\}/
    );
    if (nodeMatch) {
      nodeIdToIndex[nodeMatch[1]] = {
        index: Number(nodeMatch[2]),
        size: Number(nodeMatch[3]),
      };
      continue;
    }

    // nodeIDList["localIdToGlobalId"][N] = { }  (sub-array init, skip)
    if (/^nodeIDList\["localIdToGlobalId"\]\[.*\]\s*=\s*\{\s*\}/.test(trimmed))
      continue;
    // nodeIDList["localIdToGlobalId"] = { }  (top-level init, skip)
    if (
      /^nodeIDList\["localIdToGlobalId"\]\s*=\s*\{\s*\}/.test(trimmed)
    )
      continue;

    // nodeIDList["localIdToGlobalId"][N]["size"] = M
    const localSizeMatch = trimmed.match(
      /^nodeIDList\["localIdToGlobalId"\]\[(\d+)\]\["size"\]\s*=\s*(\d+)/
    );
    if (localSizeMatch) {
      const groupIdx = localSizeMatch[1];
      if (!localIdToGlobalId[groupIdx]) localIdToGlobalId[groupIdx] = {};
      localIdToGlobalId[groupIdx].size = Number(localSizeMatch[2]);
      continue;
    }

    // nodeIDList["localIdToGlobalId"][N][M] = V
    const localMapMatch = trimmed.match(
      /^nodeIDList\["localIdToGlobalId"\]\[(\d+)\]\[(\d+)\]\s*=\s*(\d+)/
    );
    if (localMapMatch) {
      const groupIdx = localMapMatch[1];
      const localId = localMapMatch[2];
      const globalId = Number(localMapMatch[3]);
      if (!localIdToGlobalId[groupIdx]) localIdToGlobalId[groupIdx] = {};
      if (!localIdToGlobalId[groupIdx].map) localIdToGlobalId[groupIdx].map = {};
      localIdToGlobalId[groupIdx].map[localId] = globalId;
      continue;
    }
  }

  return { size, sizeNotable, nodeIdToIndex, localIdToGlobalId };
}

// ---------------------------------------------------------------------------
// Verify sd stat lines round-trip
// ---------------------------------------------------------------------------

function verifySdRoundTrip(data) {
  let sdCount = 0;
  let missing = 0;

  for (const entry of [...data.additions, ...data.nodes]) {
    for (const line of entry.sd) {
      sdCount++;
      if (!line || line.length === 0) {
        missing++;
        console.error(`  Empty sd line in entry ${entry.id}`);
      }
    }
  }

  console.log(`  sd lines total: ${sdCount} (${missing} empty)`);
  return missing === 0;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log("Parsing LegionPassives.lua...");
const passives = parseLegionPassives();
console.log(
  `  additions: ${passives.additions.length}, nodes: ${passives.nodes.length}`
);
verifySdRoundTrip(passives);

console.log("Parsing NodeIndexMapping.lua...");
const nodeIndex = parseNodeIndexMapping();
const nodeIdCount = Object.keys(nodeIndex.nodeIdToIndex).length;
console.log(
  `  size: ${nodeIndex.size}, sizeNotable: ${nodeIndex.sizeNotable}, entries: ${nodeIdCount}`
);
const localGroupCount = Object.keys(nodeIndex.localIdToGlobalId).length;
console.log(`  localIdToGlobalId groups: ${localGroupCount}`);

// Validate counts
const EXPECTED_ADDITIONS = 337;
const EXPECTED_NODE_INDEX_SIZE = 1937;

if (passives.additions.length < EXPECTED_ADDITIONS) {
  console.error(
    `WARNING: Expected at least ${EXPECTED_ADDITIONS} additions, got ${passives.additions.length}`
  );
}
if (nodeIdCount !== EXPECTED_NODE_INDEX_SIZE) {
  console.error(
    `WARNING: Expected ${EXPECTED_NODE_INDEX_SIZE} node index entries, got ${nodeIdCount}`
  );
}

// Write outputs
const passivesPath = resolve(ENGINE_DATA_DIR, "timeless-passives.json");
writeFileSync(passivesPath, JSON.stringify(passives, null, 2));
console.log(`Wrote ${passivesPath}`);

const nodeIndexPath = resolve(ENGINE_DATA_DIR, "timeless-node-index.json");
writeFileSync(nodeIndexPath, JSON.stringify(nodeIndex, null, 2));
console.log(`Wrote ${nodeIndexPath}`);

console.log("Done.");
