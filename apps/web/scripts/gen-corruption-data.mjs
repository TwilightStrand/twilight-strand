#!/usr/bin/env node
/**
 * Generates corruption implicit data from PoB's ModCorrupted.lua.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = resolve(__dirname, "../public/data/pob/Data/ModCorrupted.lua");
const OUT = resolve(__dirname, "../data/corruption-data.generated.ts");

const raw = readFileSync(INPUT, "utf-8");

const entries = [];
const re = /\["(\w+)"\]\s*=\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
let m;

while ((m = re.exec(raw)) !== null) {
  const id = m[1];
  const block = m[2];

  const modMatch = block.match(/"([^"]+%?[^"]*(?:Damage|Life|Speed|Charges?|Resistance|Level|Gems|Block|Strike|Mana|Armour|Evasion|Energy Shield|Leech|Dodge|Suppress|Flee|Knocked|Ignite|Frozen|Shock|Curse|maximum)[^"]*)"/);
  if (!modMatch) {
    const fallback = block.match(/affix\s*=\s*"[^"]*",\s*"([^"]+)"/);
    if (!fallback) continue;
    entries.push({ id, mod: fallback[1], slots: extractSlots(block), level: extractLevel(block) });
    continue;
  }

  entries.push({
    id,
    mod: modMatch[1],
    slots: extractSlots(block),
    level: extractLevel(block),
  });
}

function extractSlots(block) {
  const wk = block.match(/weightKey\s*=\s*\{([^}]+)\}/);
  if (!wk) return [];
  const slots = [...wk[1].matchAll(/"(\w+)"/g)]
    .map((m) => m[1])
    .filter((s) => s !== "default");
  return slots;
}

function extractLevel(block) {
  const lm = block.match(/level\s*=\s*(\d+)/);
  return lm ? parseInt(lm[1]) : 1;
}

const SLOT_MAP = {
  helmet: "Helmet",
  gloves: "Gloves",
  boots: "Boots",
  body_armour: "Body Armour",
  amulet: "Amulet",
  ring: "Ring",
  belt: "Belt",
  shield: "Shield",
  weapon: "Weapon",
  sword: "Weapon",
  axe: "Weapon",
  dagger: "Weapon",
  wand: "Weapon",
  bow: "Weapon",
  claw: "Weapon",
  staff: "Weapon",
  two_hand_weapon: "Weapon",
  quiver: "Quiver",
  jewel: "Jewel",
  focus: "Shield",
};

const mapped = entries.map((e) => ({
  id: e.id,
  mod: e.mod.replace(/\((\d+)-(\d+)\)/g, (_, lo, hi) => String(Math.round((parseInt(lo) + parseInt(hi)) / 2))),
  rawMod: e.mod,
  slots: [...new Set(e.slots.map((s) => SLOT_MAP[s]).filter(Boolean))],
  level: e.level,
}));

const output = `// Auto-generated from PoB ModCorrupted.lua
// Generated: ${new Date().toISOString().split("T")[0]}

export interface CorruptionMod {
  id: string;
  mod: string;
  rawMod: string;
  slots: string[];
  level: number;
}

export const CORRUPTION_MODS: CorruptionMod[] = ${JSON.stringify(mapped, null, 2)};
`;

writeFileSync(OUT, output);
console.log(`Generated ${mapped.length} corruption implicits`);
