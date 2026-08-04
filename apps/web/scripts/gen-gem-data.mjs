#!/usr/bin/env node
/**
 * Generates gem data from PoB skill files.
 * Extracts: name, castTime, critChance, damageEffectiveness, tags, base damage at level 20.
 *
 * Usage: node scripts/gen-gem-data.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = resolve(__dirname, "../public/data/pob/Data/Skills");
const GEMS_FILE = resolve(__dirname, "../public/data/pob/Data/Gems.lua");
const OUT = resolve(__dirname, "../data/gem-data.generated.ts");

// Parse gem metadata (tags, requirements)
function parseGems(text) {
  const gems = {};
  const re = /\["([^"]+)"\]\s*=\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const id = match[1];
    const block = match[2];
    const name = block.match(/name\s*=\s*"([^"]+)"/)?.[1];
    if (!name) continue;
    const tagStr = block.match(/tagString\s*=\s*"([^"]+)"/)?.[1] || "";
    const reqStr = parseInt(block.match(/reqStr\s*=\s*(\d+)/)?.[1] || "0");
    const reqDex = parseInt(block.match(/reqDex\s*=\s*(\d+)/)?.[1] || "0");
    const reqInt = parseInt(block.match(/reqInt\s*=\s*(\d+)/)?.[1] || "0");
    const isVaal = block.includes("vaalGem = true");
    const isSupport = id.includes("Support");
    gems[name] = { name, tags: tagStr, reqStr, reqDex, reqInt, isVaal, isSupport };
  }
  return gems;
}

// Parse skill files for base damage, crit, speed
function parseSkillFile(text) {
  const skills = {};
  // Match each skill block
  const skillRe = /skills\["([^"]+)"\]\s*=\s*\{/g;
  let m;
  while ((m = skillRe.exec(text)) !== null) {
    const name = m[1];
    const start = m.index;
    // Find the block (rough: find matching braces)
    let depth = 0;
    let end = start;
    for (let i = start; i < text.length; i++) {
      if (text[i] === "{") depth++;
      if (text[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    const block = text.substring(start, end + 1);

    const castTime = parseFloat(block.match(/castTime\s*=\s*([0-9.]+)/)?.[1] || "0");
    const baseEff = parseFloat(block.match(/baseEffectiveness\s*=\s*([0-9.]+)/)?.[1] || "0");
    const incEff = parseFloat(block.match(/incrementalEffectiveness\s*=\s*([0-9.]+)/)?.[1] || "0");

    // Extract level 20 data
    const lvl20Match = block.match(/\[20\]\s*=\s*\{([^}]+)\}/);
    let critChance = 0;
    let damageEffectiveness = 1;
    let baseDamageMin = 0;
    let baseDamageMax = 0;

    if (lvl20Match) {
      const lvlBlock = lvl20Match[1];
      critChance = parseFloat(lvlBlock.match(/critChance\s*=\s*([0-9.]+)/)?.[1] || "0");
      damageEffectiveness = parseFloat(lvlBlock.match(/damageEffectiveness\s*=\s*([0-9.]+)/)?.[1] || "1");

      // Base damage from effectiveness + level scaling
      // PoB formula: base = baseEffectiveness * (1 + incrementalEffectiveness)^(level-1)
      if (baseEff > 0) {
        const avgDmg = baseEff * Math.pow(1 + incEff, 19); // level 20
        baseDamageMin = avgDmg * 0.8;
        baseDamageMax = avgDmg * 1.2;
      }

      // Try to get explicit min/max from the level data
      const nums = lvlBlock.match(/^[\s,]*([0-9.]+)/);
      // The first two numbers in the level array are often damage multipliers
    }

    // Extract stat names to determine damage type
    const statsMatch = block.match(/stats\s*=\s*\{([^}]+)\}/);
    let damageType = "physical";
    if (statsMatch) {
      const stats = statsMatch[1];
      if (stats.includes("lightning")) damageType = "lightning";
      else if (stats.includes("cold")) damageType = "cold";
      else if (stats.includes("fire")) damageType = "fire";
      else if (stats.includes("chaos")) damageType = "chaos";
    }

    // Determine if spell or attack
    const isSpell = block.includes("spell = true");
    const isAttack = !isSpell;

    // Skip if no useful data
    if (castTime === 0 && baseEff === 0) continue;

    skills[name] = {
      name,
      castTime: castTime || 1.0,
      critChance,
      damageEffectiveness,
      baseEffectiveness: baseEff,
      incrementalEffectiveness: incEff,
      baseDamageMin: Math.round(baseDamageMin * 100) / 100,
      baseDamageMax: Math.round(baseDamageMax * 100) / 100,
      damageType,
      isSpell,
    };
  }
  return skills;
}

console.log("Generating gem data...");

// Parse gem metadata
const gemsText = readFileSync(GEMS_FILE, "utf8");
const gems = parseGems(gemsText);
console.log(`  Parsed ${Object.keys(gems).length} gems from Gems.lua`);

// Parse skill files
const allSkills = {};
const skillFiles = readdirSync(SKILLS_DIR).filter(f => f.endsWith(".lua"));
for (const file of skillFiles) {
  const text = readFileSync(resolve(SKILLS_DIR, file), "utf8");
  const skills = parseSkillFile(text);
  Object.assign(allSkills, skills);
}
console.log(`  Parsed ${Object.keys(allSkills).length} skills from ${skillFiles.length} files`);

// Merge gem metadata with skill data
const merged = {};
for (const [name, skill] of Object.entries(allSkills)) {
  const gem = gems[name];
  merged[name] = {
    ...skill,
    tags: gem?.tags || "",
    reqStr: gem?.reqStr || 0,
    reqDex: gem?.reqDex || 0,
    reqInt: gem?.reqInt || 0,
    isVaal: gem?.isVaal || false,
    isSupport: gem?.isSupport || false,
  };
}

// Generate output
const output = [
  "// AUTO-GENERATED from PoB data files. Do not edit manually.",
  `// Source: Gems.lua + Data/Skills/*.lua`,
  `// Generated: ${new Date().toISOString()}`,
  "// Run: node apps/web/scripts/gen-gem-data.mjs",
  "",
  "export interface GemData {",
  "  name: string;",
  "  castTime: number;",
  "  critChance: number;",
  "  damageEffectiveness: number;",
  "  baseEffectiveness: number;",
  "  incrementalEffectiveness: number;",
  "  baseDamageMin: number;",
  "  baseDamageMax: number;",
  "  damageType: string;",
  "  isSpell: boolean;",
  "  tags: string;",
  "  reqStr: number;",
  "  reqDex: number;",
  "  reqInt: number;",
  "  isVaal: boolean;",
  "  isSupport: boolean;",
  "}",
  "",
  `export const GEM_DATA: Record<string, GemData> = ${JSON.stringify(merged, null, 2)};`,
];

writeFileSync(OUT, output.join("\n"));
console.log(`  Wrote ${Object.keys(merged).length} gems to ${OUT}`);
console.log("Done.");
