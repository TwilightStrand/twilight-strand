#!/usr/bin/env node
/**
 * Extracts per-level gem data from ALL PoB skill Lua files and outputs JSON
 * for the Rust engine. Auto-discovers every gem; no hardcoded list.
 *
 * PoB damage formula (statInterpolation types):
 *   Type 0: constant (use raw value)
 *   Type 1: linear interpolation between levels
 *   Type 3: exponential
 *     avail = (SDB + SDI * (lvlReq - 1)) * baseEff * (1 + incEff)^(lvlReq - 1)
 *     stat = round(avail * positionalValue)
 *
 * Usage: node scripts/gen-gem-level-data.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = resolve(__dirname, "../public/data/pob/Data/Skills");
const GEMS_LUA = resolve(
  __dirname,
  "../public/data/pob/Data/Gems.lua"
);
const ENGINE_DATA_DIR = resolve(__dirname, "../../../packages/engine/data");

const SDB = 3.885209;
const SDI = 0.360246;

// ---- Gems.lua cross-reference ----

function parseGemsLua() {
  const text = readFileSync(GEMS_LUA, "utf8");
  const gems = {};
  const re =
    /\["Metadata\/Items\/Gems\/[^"]+"\]\s*=\s*\{/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const blockStart = match.index;
    let depth = 0;
    let end = blockStart;
    for (let i = blockStart; i < text.length; i++) {
      if (text[i] === "{") depth++;
      if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    const block = text.substring(blockStart, end + 1);
    const name = block.match(/name\s*=\s*"([^"]+)"/)?.[1];
    const variantId = block.match(/variantId\s*=\s*"([^"]+)"/)?.[1];
    const grantedEffectId =
      block.match(/grantedEffectId\s*=\s*"([^"]+)"/)?.[1];
    const tagString = block.match(/tagString\s*=\s*"([^"]+)"/)?.[1] || "";
    const isSupport = /support\s*=\s*true/.test(block);
    const isVaal = /vaalGem\s*=\s*true/.test(block);
    const reqStr = parseInt(block.match(/reqStr\s*=\s*(\d+)/)?.[1] || "0");
    const reqDex = parseInt(block.match(/reqDex\s*=\s*(\d+)/)?.[1] || "0");
    const reqInt = parseInt(block.match(/reqInt\s*=\s*(\d+)/)?.[1] || "0");

    if (grantedEffectId) {
      gems[grantedEffectId] = {
        name: name || grantedEffectId,
        variant_id: variantId || grantedEffectId,
        tag_string: tagString,
        is_support: isSupport,
        is_vaal: isVaal,
        req_str: reqStr,
        req_dex: reqDex,
        req_int: reqInt,
      };
    }
  }
  return gems;
}

// ---- Skill block parser ----

function extractBlock(text, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}") {
      depth--;
      if (depth === 0) return text.substring(startIdx, i + 1);
    }
  }
  return null;
}

function parseAllSkillBlocks(text) {
  const results = [];
  const re = /skills\["([^"]+)"\]\s*=\s*\{/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const skillId = m[1];
    const block = extractBlock(text, m.index + m[0].length - 1);
    if (block) results.push({ skillId, block });
  }
  return results;
}

function parseSkillData(block) {
  const castTime =
    parseFloat(block.match(/castTime\s*=\s*([0-9.]+)/)?.[1] || "0") || 0;
  const baseEff = parseFloat(
    block.match(/baseEffectiveness\s*=\s*([0-9.]+)/)?.[1] || "0"
  );
  const incEff = parseFloat(
    block.match(/incrementalEffectiveness\s*=\s*([0-9.]+)/)?.[1] || "0"
  );
  const isSupport = /\tsupport\s*=\s*true/.test(block);
  const name = block.match(/\tname\s*=\s*"([^"]+)"/)?.[1] || "";

  // baseFlags
  const baseFlags = {};
  const bfMatch = block.match(/baseFlags\s*=\s*\{([^}]+)\}/);
  if (bfMatch) {
    const flagRe = /(\w+)\s*=\s*true/g;
    let fm;
    while ((fm = flagRe.exec(bfMatch[1])) !== null) {
      baseFlags[fm[1]] = true;
    }
  }

  // stats array
  const stats = [];
  const statsMatch = block.match(/\tstats\s*=\s*\{([^}]+)\}/);
  if (statsMatch) {
    const re2 = /"([^"]+)"/g;
    let sm;
    while ((sm = re2.exec(statsMatch[1])) !== null) stats.push(sm[1]);
  }

  // statMap (for supports)
  const statMap = parseStatMap(block);

  // constantStats
  const constantStats = [];
  const csMatch = block.match(/\tconstantStats\s*=\s*\{/);
  if (csMatch) {
    const csStart = block.indexOf(csMatch[0]);
    const csBlock = extractBlock(block, csStart + csMatch[0].length - 1);
    if (csBlock) {
      const entryRe = /\{\s*"([^"]+)"\s*,\s*(-?[\d.]+)\s*\}/g;
      let ce;
      while ((ce = entryRe.exec(csBlock)) !== null) {
        constantStats.push({
          stat: ce[1],
          value: parseFloat(ce[2]),
        });
      }
    }
  }

  // qualityStats
  const qualityStats = [];
  const qsMatch = block.match(/\tqualityStats\s*=\s*\{/);
  if (qsMatch) {
    const qsStart = block.indexOf(qsMatch[0]);
    const qsBlock = extractBlock(block, qsStart + qsMatch[0].length - 1);
    if (qsBlock) {
      const entryRe = /\{\s*"([^"]+)"\s*,\s*(-?[\d.]+)\s*\}/g;
      let qe;
      while ((qe = entryRe.exec(qsBlock)) !== null) {
        qualityStats.push({ stat: qe[1], value: parseFloat(qe[2]) });
      }
    }
  }

  // levels
  const levels = parseLevels(block);

  return {
    name,
    castTime,
    baseEff,
    incEff,
    isSupport,
    baseFlags,
    stats,
    statMap,
    constantStats,
    qualityStats,
    levels,
  };
}

function parseStatMap(block) {
  const smStart = block.match(/\tstatMap\s*=\s*\{/);
  if (!smStart) return {};

  const startIdx = block.indexOf(smStart[0]);
  const smBlock = extractBlock(block, startIdx + smStart[0].length - 1);
  if (!smBlock) return {};

  const result = {};
  const entryRe = /\["([^"]+)"\]\s*=\s*\{/g;
  let em;
  while ((em = entryRe.exec(smBlock)) !== null) {
    const statName = em[1];
    const entryBlock = extractBlock(
      smBlock,
      em.index + em[0].length - 1
    );
    if (!entryBlock) continue;

    const modMatch = entryBlock.match(
      /mod\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*(?:,\s*([^,)]+))?\s*(?:,\s*([^,)]+))?\s*(?:,\s*([^,)]+))?/
    );
    if (modMatch) {
      const entry = {
        mod_stat: modMatch[1],
        mod_type: modMatch[2],
      };
      if (modMatch[4] && modMatch[4].trim() !== "nil") {
        entry.flags = modMatch[4]
          .trim()
          .replace(/ModFlag\./g, "")
          .replace(/bit\.bor\(/, "")
          .replace(/\)/, "")
          .replace(/KeywordFlag\./g, "Keyword:")
          .trim();
      }
      result[statName] = entry;
    }
  }
  return result;
}

function parseLevels(block) {
  const levelsMatch = block.match(/\tlevels\s*=\s*\{/);
  if (!levelsMatch) return {};

  const levelsStart = block.indexOf(levelsMatch[0]);
  const levelsBlock = extractBlock(
    block,
    levelsStart + levelsMatch[0].length - 1
  );
  if (!levelsBlock) return {};

  const levels = {};
  const lvlRe = /\[(\d+)\]\s*=\s*\{/g;
  let lm;
  while ((lm = lvlRe.exec(levelsBlock)) !== null) {
    const lvl = parseInt(lm[1]);
    const entryStart = lm.index + lm[0].length;
    let depth = 1;
    let entryEnd = entryStart;
    for (let i = entryStart; i < levelsBlock.length; i++) {
      if (levelsBlock[i] === "{") depth++;
      if (levelsBlock[i] === "}") {
        depth--;
        if (depth === 0) {
          entryEnd = i;
          break;
        }
      }
    }
    const entryText = levelsBlock.substring(entryStart, entryEnd);

    // Positional values (before any key=value)
    const positionalValues = [];
    const cleanEntry = entryText.replace(/\{[^}]*\}/g, "NESTED");
    for (const part of cleanEntry.split(",")) {
      const trimmed = part.trim();
      if (trimmed.includes("=")) break;
      if (trimmed === "NESTED") break;
      const num = parseFloat(trimmed);
      if (!isNaN(num)) positionalValues.push(num);
    }

    const critChance = parseFloat(
      entryText.match(/critChance\s*=\s*([0-9.]+)/)?.[1] || "0"
    );
    const damageEffectiveness = parseFloat(
      entryText.match(/damageEffectiveness\s*=\s*([0-9.]+)/)?.[1] || "0"
    );
    const levelRequirement = parseInt(
      entryText.match(/levelRequirement\s*=\s*(\d+)/)?.[1] || "0"
    );
    const baseMultiplier = parseFloat(
      entryText.match(/baseMultiplier\s*=\s*([0-9.]+)/)?.[1] || "0"
    );
    const attackSpeedMultiplier = parseFloat(
      entryText.match(/attackSpeedMultiplier\s*=\s*(-?[0-9.]+)/)?.[1] || "0"
    );
    const manaMultiplier = parseInt(
      entryText.match(/manaMultiplier\s*=\s*(-?\d+)/)?.[1] || "0"
    );

    const siMatch = entryText.match(
      /statInterpolation\s*=\s*\{\s*([\d\s,]+)\s*\}/
    );
    const statInterpolation = [];
    if (siMatch) {
      for (const s of siMatch[1].split(",")) {
        const n = parseInt(s.trim());
        if (!isNaN(n)) statInterpolation.push(n);
      }
    }

    levels[lvl] = {
      positionalValues,
      critChance,
      damageEffectiveness,
      levelRequirement,
      baseMultiplier,
      attackSpeedMultiplier,
      manaMultiplier,
      statInterpolation,
    };
  }
  return levels;
}

// ---- Stat value computation ----

function computeStatValue(type, baseEff, incEff, levelReq, rawValue) {
  if (type === 0) return rawValue;
  if (type === 1) return rawValue;
  if (type === 3) {
    const avail =
      (SDB + SDI * (levelReq - 1)) * baseEff * Math.pow(1 + incEff, levelReq - 1);
    return Math.round(avail * rawValue);
  }
  return rawValue;
}

function computeAllStatValues(skill, level) {
  const result = {};
  const statInterp = level.statInterpolation;
  for (let i = 0; i < skill.stats.length; i++) {
    const statName = skill.stats[i];
    const rawVal = level.positionalValues[i];
    if (rawVal === undefined) continue;
    const interpType = statInterp[i] ?? 1;
    result[statName] = computeStatValue(
      interpType,
      skill.baseEff,
      skill.incEff,
      level.levelRequirement,
      rawVal
    );
  }
  return result;
}

// ---- Damage type detection from stat names ----

const DAMAGE_TYPE_PATTERNS = {
  fire: "Fire",
  cold: "Cold",
  lightning: "Lightning",
  chaos: "Chaos",
  physical: "Physical",
};

function detectDamageTypes(stats) {
  const types = new Set();
  for (const s of stats) {
    if (!s.includes("damage")) continue;
    for (const [pattern, type] of Object.entries(DAMAGE_TYPE_PATTERNS)) {
      if (s.includes(pattern)) types.add(type);
    }
  }
  return [...types];
}

function classifyGem(skill, block) {
  const flags = skill.baseFlags;
  const isAttack = !!flags.attack;
  const isDot =
    skill.stats.some((s) => s.includes("damage_to_deal_per_minute")) ||
    /SkillType\.DamageOverTime/.test(block) ||
    /SkillType\.CausesBurning/.test(block) ||
    skill.stats.some((s) => s.includes("spell_damage_+%_final") && !s.includes("support"));
  const isMinion = skill.stats.some(
    (s) => s.includes("number_of_minions") || s.includes("minion")
  ) && skill.name.toLowerCase().includes("summon");

  return { isAttack, isDot, isMinion };
}

// ---- Build output entries ----

function buildActiveGemEntry(skillId, skill, gemMeta, block) {
  const cls = classifyGem(skill, block);
  const damageTypes = detectDamageTypes(skill.stats);
  const tags = gemMeta?.tag_string
    ? gemMeta.tag_string.split(",").map((t) => t.trim())
    : [];

  const entry = {
    skill_id: skillId,
    name: gemMeta?.name || skill.name || skillId,
    is_support: false,
    is_attack: cls.isAttack,
    is_dot: cls.isDot,
    is_minion: cls.isMinion,
    cast_time: skill.castTime,
    damage_types: damageTypes,
    tags,
    levels: {},
  };

  for (const [lvlStr, lvlData] of Object.entries(skill.levels)) {
    const lvl = parseInt(lvlStr);
    const statValues = computeAllStatValues(skill, lvlData);

    const damages = [];
    for (const s of skill.stats) {
      if (!s.includes("minimum_base_")) continue;
      const maxStat = s.replace("minimum_base_", "maximum_base_");
      if (statValues[s] !== undefined && statValues[maxStat] !== undefined) {
        let dmgType = "Physical";
        for (const [pattern, type] of Object.entries(DAMAGE_TYPE_PATTERNS)) {
          if (s.includes(pattern)) {
            dmgType = type;
            break;
          }
        }
        damages.push({
          damage_type: dmgType,
          min: statValues[s],
          max: statValues[maxStat],
        });
      }
    }

    let dotDpm = 0;
    for (const s of skill.stats) {
      if (s.includes("damage_to_deal_per_minute") && statValues[s]) {
        dotDpm = statValues[s];
      }
    }

    // Spell damage more % (for RF-style skills)
    let spellDmgMore = 0;
    for (const s of skill.stats) {
      if (s.includes("spell_damage_+%_final") && statValues[s]) {
        spellDmgMore = statValues[s];
      }
    }

    const lvlEntry = {
      level_requirement: lvlData.levelRequirement,
      crit_chance: lvlData.critChance,
      damage_effectiveness: lvlData.damageEffectiveness,
    };

    if (damages.length > 0) lvlEntry.damages = damages;
    if (lvlData.baseMultiplier) lvlEntry.base_multiplier = lvlData.baseMultiplier;
    if (lvlData.attackSpeedMultiplier) lvlEntry.attack_speed_multiplier = lvlData.attackSpeedMultiplier;
    if (dotDpm > 0) lvlEntry.dot_dpm = dotDpm;
    if (spellDmgMore) lvlEntry.spell_damage_more_pct = spellDmgMore;

    entry.levels[lvl] = lvlEntry;
  }

  return entry;
}

function buildSupportGemEntry(skillId, skill, gemMeta) {
  const tags = gemMeta?.tag_string
    ? gemMeta.tag_string.split(",").map((t) => t.trim())
    : [];

  // Pre-compute constant modifiers (apply at every level)
  const constantMods = [];
  for (const cs of skill.constantStats) {
    const mapping = skill.statMap[cs.stat];
    if (mapping) {
      constantMods.push({
        stat: mapping.mod_stat,
        type: mapping.mod_type.toLowerCase(),
        value: cs.value,
        flags: mapping.flags || null,
      });
    }
  }

  const entry = {
    skill_id: skillId,
    name: gemMeta?.name || skill.name || skillId,
    is_support: true,
    tags,
    constant_mods: constantMods,
    levels: {},
  };

  for (const [lvlStr, lvlData] of Object.entries(skill.levels)) {
    const lvl = parseInt(lvlStr);
    const statValues = computeAllStatValues(skill, lvlData);

    // Build per-level modifiers from statMap
    const mods = [];
    for (const [statName, val] of Object.entries(statValues)) {
      const mapping = skill.statMap[statName];
      if (mapping) {
        mods.push({
          stat: mapping.mod_stat,
          type: mapping.mod_type.toLowerCase(),
          value: val,
          flags: mapping.flags || null,
        });
      } else {
        // Stats without statMap: store as raw for the engine to interpret
        mods.push({
          stat: statName,
          type: "raw",
          value: val,
        });
      }
    }

    entry.levels[lvl] = {
      level_requirement: lvlData.levelRequirement,
      mana_multiplier: lvlData.manaMultiplier,
      mods,
    };
  }

  return entry;
}

// ---- Main ----

console.log("Auto-discovering all gems from PoB skill files...\n");

const gemRegistry = parseGemsLua();
console.log(`Parsed ${Object.keys(gemRegistry).length} entries from Gems.lua`);

const SKILL_FILES = [
  "act_str.lua",
  "act_dex.lua",
  "act_int.lua",
  "other.lua",
  "minion.lua",
  "sup_str.lua",
  "sup_dex.lua",
  "sup_int.lua",
];

const output = {};
let activeCount = 0;
let supportCount = 0;
let skippedCount = 0;

for (const file of SKILL_FILES) {
  const text = readFileSync(resolve(SKILLS_DIR, file), "utf8");
  const blocks = parseAllSkillBlocks(text);
  console.log(`  ${file}: ${blocks.length} skill blocks`);

  for (const { skillId, block } of blocks) {
    const skill = parseSkillData(block);
    if (Object.keys(skill.levels).length === 0) {
      skippedCount++;
      continue;
    }

    const gemMeta = gemRegistry[skillId];

    if (skill.isSupport) {
      output[skillId] = buildSupportGemEntry(skillId, skill, gemMeta);
      supportCount++;
    } else {
      output[skillId] = buildActiveGemEntry(skillId, skill, gemMeta, block);
      activeCount++;
    }
  }
}

const outPath = resolve(ENGINE_DATA_DIR, "gems.json");
writeFileSync(outPath, JSON.stringify(output));

console.log(
  `\nWrote ${Object.keys(output).length} gems (${activeCount} active, ${supportCount} support, ${skippedCount} skipped) to ${outPath}`
);

// Spot-check a few known gems
const checks = ["Arc", "Fireball", "Vortex", "Cyclone", "SupportControlledDestruction"];
for (const id of checks) {
  const gem = output[id];
  if (!gem) {
    console.log(`  CHECK ${id}: NOT FOUND`);
    continue;
  }
  const l20 = gem.levels[20];
  if (!l20) {
    console.log(`  CHECK ${id}: no level 20 data`);
    continue;
  }
  if (gem.is_support) {
    console.log(
      `  CHECK ${id}: L20 mods = ${JSON.stringify(l20.mods)}`
    );
  } else if (l20.damages?.length > 0) {
    console.log(
      `  CHECK ${id}: L20 ${l20.damages[0].damage_type} = ${l20.damages[0].min}-${l20.damages[0].max}`
    );
  } else if (l20.base_multiplier) {
    console.log(`  CHECK ${id}: L20 baseMultiplier = ${l20.base_multiplier}`);
  } else {
    console.log(`  CHECK ${id}: L20 (special) stat_values keys = ${Object.keys(l20.stat_values).join(", ")}`);
  }
}

console.log("\nDone.");
