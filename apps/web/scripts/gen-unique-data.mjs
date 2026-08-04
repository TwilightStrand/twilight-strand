#!/usr/bin/env node
/**
 * Generates unique item data from PoB unique files.
 * Extracts: name, base, slot, mods (current variant only).
 *
 * Usage: node scripts/gen-unique-data.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UNIQUES_DIR = resolve(__dirname, "../public/data/pob/Data/Uniques");
const OUT = resolve(__dirname, "../data/unique-data.generated.ts");

const SLOT_MAP = {
  amulet: "Amulet", axe: "Weapon", belt: "Belt", body: "Body Armour",
  boots: "Boots", bow: "Weapon", claw: "Weapon", dagger: "Weapon",
  flask: "Flask", gloves: "Gloves", helmet: "Helmet", jewel: "Jewel",
  mace: "Weapon", quiver: "Quiver", ring: "Ring", shield: "Shield",
  staff: "Weapon", sword: "Weapon", wand: "Weapon",
};

function parseUniqueFile(text, slot) {
  const uniques = [];
  // Split on ]][[ to get individual items
  const blocks = text.split(/\]\],?\s*\[\[/);

  for (let block of blocks) {
    block = block.replace(/^\[\[/, "").replace(/\]\]$/, "").trim();
    if (!block || block.startsWith("--")) continue;

    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const name = lines[0];
    const base = lines[1];

    // Skip league-specific metadata
    let modStart = 2;
    let implicitCount = 0;
    let currentVariant = false;
    const hasVariants = lines.some(l => l.startsWith("Variant:"));

    for (let i = 2; i < lines.length; i++) {
      if (lines[i].startsWith("League:") || lines[i].startsWith("Source:") ||
          lines[i].startsWith("Has Alt Variant") || lines[i].startsWith("Crafted:") ||
          lines[i].startsWith("LevelReq:") || lines[i].startsWith("Quality:") ||
          lines[i].startsWith("Sockets:") || lines[i].startsWith("Talisman Tier:") ||
          lines[i].startsWith("Upgrade:") || lines[i].startsWith("Radius:") ||
          lines[i].startsWith("Limit:") || lines[i].startsWith("Selected Variant:")) {
        modStart = i + 1;
        continue;
      }
      if (lines[i].startsWith("Variant:")) {
        currentVariant = lines[i].includes("Current");
        modStart = i + 1;
        continue;
      }
      if (lines[i].startsWith("Implicits:")) {
        implicitCount = parseInt(lines[i].split(":")[1].trim()) || 0;
        modStart = i + 1;
        break;
      }
    }

    // Extract mods (skip variant-specific lines not for "Current")
    const mods = [];
    for (let i = modStart; i < lines.length; i++) {
      let line = lines[i];
      // Handle variant tags
      if (line.startsWith("{variant:")) {
        if (!line.includes("{variant:2}") && hasVariants) continue; // Skip non-current
        line = line.replace(/\{variant:\d+\}/g, "").trim();
      }
      if (line.startsWith("{tags:")) {
        line = line.replace(/\{tags:[^}]+\}/g, "").trim();
      }
      if (line.startsWith("{range:")) {
        line = line.replace(/\{range:[^}]+\}/g, "").trim();
      }
      if (line.startsWith("{crafted}")) {
        line = line.replace("{crafted}", "").trim();
        line = `(crafted) ${line}`;
      }
      if (!line || line === "--------") continue;
      mods.push(line);
    }

    if (name && base) {
      uniques.push({ name, base, slot, mods });
    }
  }

  return uniques;
}

console.log("Generating unique item data...");

const allUniques = [];
const files = readdirSync(UNIQUES_DIR).filter(f => f.endsWith(".lua") && f !== "graft.lua" && f !== "fishing.lua");

for (const file of files) {
  const slotKey = file.replace(".lua", "");
  const slot = SLOT_MAP[slotKey] || slotKey;
  const text = readFileSync(resolve(UNIQUES_DIR, file), "utf8");
  const uniques = parseUniqueFile(text, slot);
  allUniques.push(...uniques);
  console.log(`  ${file}: ${uniques.length} uniques`);
}

console.log(`  Total: ${allUniques.length} unique items`);

// Generate output
const output = [
  "// AUTO-GENERATED from PoB data files. Do not edit manually.",
  `// Source: Data/Uniques/*.lua`,
  `// Generated: ${new Date().toISOString()}`,
  "// Run: node apps/web/scripts/gen-unique-data.mjs",
  "",
  "export interface UniqueItemData {",
  "  name: string;",
  "  base: string;",
  "  slot: string;",
  "  mods: string[];",
  "}",
  "",
  `export const UNIQUE_ITEMS: UniqueItemData[] = ${JSON.stringify(allUniques, null, 2)};`,
  "",
  "export const UNIQUE_BY_NAME: Record<string, UniqueItemData> = {};",
  "for (const item of UNIQUE_ITEMS) { UNIQUE_BY_NAME[item.name] = item; }",
];

writeFileSync(OUT, output.join("\n"));
console.log(`  Wrote to ${OUT}`);
console.log("Done.");
