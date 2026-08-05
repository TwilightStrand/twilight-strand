import { describe, it, expect } from "vitest";
import { parsePobXml } from "../pob-xml-parser";
import { convertToRustInput } from "../rust-converter";
import type { TreeNode } from "@/components/tree/tree-data";
import { TEST_BUILDS } from "./fixtures/test-builds";

function mockParseStatLine(line: string): Array<{ stat: string; value: number; mod_type: string }> {
  const mods: Array<{ stat: string; value: number; mod_type: string }> = [];
  const lower = line.toLowerCase();

  const flatMatch = line.match(/\+(\d+\.?\d*)\s+to\s+(.*)/i);
  const pctMatch = line.match(/(\d+\.?\d*)%\s+(increased|more)\s+(.*)/i);
  const resToMatch = line.match(/\+(\d+\.?\d*)%\s+to\s+(.*)/i);
  const addsMatch = line.match(/adds\s+(\d+)\s+to\s+(\d+)\s+(.*?\s*damage)/i);

  if (lower.includes("to maximum life") && flatMatch) {
    mods.push({ stat: "Life", value: parseFloat(flatMatch[1]), mod_type: "flat" });
  } else if (lower.includes("to maximum energy shield") && flatMatch) {
    mods.push({ stat: "EnergyShield", value: parseFloat(flatMatch[1]), mod_type: "flat" });
  } else if (lower.includes("to maximum mana") && flatMatch) {
    mods.push({ stat: "Mana", value: parseFloat(flatMatch[1]), mod_type: "flat" });
  } else if (lower.includes("to evasion rating") && flatMatch) {
    mods.push({ stat: "Evasion", value: parseFloat(flatMatch[1]), mod_type: "flat" });
  } else if (lower.includes("to accuracy rating") && flatMatch) {
    mods.push({ stat: "Accuracy", value: parseFloat(flatMatch[1]), mod_type: "flat" });
  } else if (lower.includes("to strength") && flatMatch) {
    mods.push({ stat: "Str", value: parseFloat(flatMatch[1]), mod_type: "flat" });
  } else if (lower.includes("to dexterity") && flatMatch) {
    mods.push({ stat: "Dex", value: parseFloat(flatMatch[1]), mod_type: "flat" });
  } else if (lower.includes("to intelligence") && flatMatch) {
    mods.push({ stat: "Int", value: parseFloat(flatMatch[1]), mod_type: "flat" });
  } else if (lower.includes("to fire resistance") && resToMatch) {
    mods.push({ stat: "FireRes", value: parseFloat(resToMatch[1]), mod_type: "flat" });
  } else if (lower.includes("to cold resistance") && resToMatch) {
    mods.push({ stat: "ColdRes", value: parseFloat(resToMatch[1]), mod_type: "flat" });
  } else if (lower.includes("to lightning resistance") && resToMatch) {
    mods.push({ stat: "LightningRes", value: parseFloat(resToMatch[1]), mod_type: "flat" });
  } else if (lower.includes("to chaos resistance") && resToMatch) {
    mods.push({ stat: "ChaosRes", value: parseFloat(resToMatch[1]), mod_type: "flat" });
  } else if (lower.includes("to all maximum elemental resistances") && resToMatch) {
    const v = parseFloat(resToMatch[1]);
    mods.push({ stat: "FireResMax", value: v, mod_type: "flat" });
    mods.push({ stat: "ColdResMax", value: v, mod_type: "flat" });
    mods.push({ stat: "LightningResMax", value: v, mod_type: "flat" });
  } else if (lower.includes("to critical strike multiplier") && resToMatch) {
    mods.push({ stat: "CritMultiplier", value: parseFloat(resToMatch[1]), mod_type: "flat" });
  } else if (lower.includes("increased armour and evasion") && pctMatch) {
    mods.push({ stat: "Armour", value: parseFloat(pctMatch[1]), mod_type: "increased" });
    mods.push({ stat: "Evasion", value: parseFloat(pctMatch[1]), mod_type: "increased" });
  } else if (lower.includes("increased armour") && pctMatch) {
    mods.push({ stat: "Armour", value: parseFloat(pctMatch[1]), mod_type: "increased" });
  } else if (lower.includes("increased attack speed") && pctMatch) {
    mods.push({ stat: "AttackSpeed", value: parseFloat(pctMatch[1]), mod_type: "increased" });
  } else if (lower.includes("increased movement speed") && pctMatch) {
    mods.push({ stat: "MovementSpeed", value: parseFloat(pctMatch[1]), mod_type: "increased" });
  } else if (lower.includes("increased critical strike chance") && pctMatch) {
    mods.push({ stat: "CritChance", value: parseFloat(pctMatch[1]), mod_type: "increased" });
  } else if (lower.includes("increased melee damage") && pctMatch) {
    mods.push({ stat: "MeleeDamage", value: parseFloat(pctMatch[1]), mod_type: "increased" });
  } else if (lower.includes("increased projectile damage") && pctMatch) {
    mods.push({ stat: "ProjectileDamage", value: parseFloat(pctMatch[1]), mod_type: "increased" });
  } else if (lower.includes("increased chaos damage") && pctMatch) {
    mods.push({ stat: "ChaosDamage", value: parseFloat(pctMatch[1]), mod_type: "increased" });
  } else if (lower.includes("increased damage") && pctMatch) {
    mods.push({ stat: "Damage", value: parseFloat(pctMatch[1]), mod_type: "increased" });
  } else if (lower.includes("of life per second")) {
    const m = line.match(/(\d+\.?\d*)%/);
    if (m) mods.push({ stat: "LifeRegenPct", value: parseFloat(m[1]), mod_type: "flat" });
  } else if (lower.includes("physical damage") && flatMatch && !lower.includes("adds")) {
    mods.push({ stat: "Damage", value: parseFloat(flatMatch[1]), mod_type: "flat" });
  } else if (lower.includes("leeched as life")) {
    const m = line.match(/(\d+\.?\d*)%/);
    if (m) mods.push({ stat: "LifeLeechPct", value: parseFloat(m[1]), mod_type: "flat" });
  } else if (addsMatch) {
    const min = parseFloat(addsMatch[1]);
    const max = parseFloat(addsMatch[2]);
    const type = addsMatch[3].toLowerCase();
    if (type.includes("physical")) {
      mods.push({ stat: "AddedPhysMin", value: min, mod_type: "flat" });
      mods.push({ stat: "AddedPhysMax", value: max, mod_type: "flat" });
    } else if (type.includes("fire")) {
      mods.push({ stat: "AddedFireMin", value: min, mod_type: "flat" });
      mods.push({ stat: "AddedFireMax", value: max, mod_type: "flat" });
    } else if (type.includes("cold")) {
      mods.push({ stat: "AddedColdMin", value: min, mod_type: "flat" });
      mods.push({ stat: "AddedColdMax", value: max, mod_type: "flat" });
    } else if (type.includes("lightning")) {
      mods.push({ stat: "AddedLightningMin", value: min, mod_type: "flat" });
      mods.push({ stat: "AddedLightningMax", value: max, mod_type: "flat" });
    } else if (type.includes("chaos")) {
      mods.push({ stat: "AddedChaosMin", value: min, mod_type: "flat" });
      mods.push({ stat: "AddedChaosMax", value: max, mod_type: "flat" });
    }
  }

  return mods;
}

const emptyTree = new Map<string, TreeNode>();

describe("Full pipeline: XML -> Parser -> Converter", () => {
  for (const build of TEST_BUILDS) {
    describe(build.name, () => {
      const parsed = parsePobXml(build.xml);

      it("should parse class/ascendancy/level correctly", () => {
        expect(parsed.stats.class_name).toBe(build.expectedClass);
        expect(parsed.stats.ascendancy).toBe(build.expectedAscendancy);
        expect(parsed.stats.level).toBe(build.expectedLevel);
      });

      it("should extract items with mods", () => {
        const totalMods = parsed.items.reduce((s, i) => s + i.mods.length, 0);
        expect(totalMods).toBeGreaterThanOrEqual(build.minItemMods);
      });

      it("should extract skill groups with supports", () => {
        expect(parsed.skills.length).toBeGreaterThanOrEqual(1);
        const mainGroup = parsed.skills[0];
        const supports = mainGroup.gems.filter((g) => g.isSupport);
        expect(supports.length).toBeGreaterThanOrEqual(build.minSupportGems);
      });

      it("should convert to RustBuildInput with modifiers", () => {
        const rustInput = convertToRustInput(
          parsed.stats,
          parsed.items,
          parsed.skills,
          emptyTree,
          mockParseStatLine,
        );

        expect(rustInput.level).toBe(build.expectedLevel);
        expect(rustInput.ascendancy_name).toBe(build.expectedAscendancy);
        expect(rustInput.modifiers.length).toBeGreaterThan(0);
        expect(rustInput.support_gems.length).toBeGreaterThanOrEqual(build.minSupportGems);
      });

      it("should detect unique items", () => {
        const rustInput = convertToRustInput(
          parsed.stats,
          parsed.items,
          parsed.skills,
          emptyTree,
          mockParseStatLine,
        );
        const hasUniques = parsed.items.some(
          (i) => i.rarity === "Unique" || i.rarity === "UNIQUE",
        );
        if (hasUniques) {
          expect(rustInput.equipped_uniques.length).toBeGreaterThan(0);
        }
      });

      it("should detect flasks", () => {
        const rustInput = convertToRustInput(
          parsed.stats,
          parsed.items,
          parsed.skills,
          emptyTree,
          mockParseStatLine,
        );
        if (build.hasFlasks) {
          expect(rustInput.active_flasks.length).toBeGreaterThan(0);
        }
      });

      if (build.hasWeapon) {
        it("should extract weapon stats", () => {
          const rustInput = convertToRustInput(
            parsed.stats,
            parsed.items,
            parsed.skills,
            emptyTree,
            mockParseStatLine,
          );
          expect(rustInput.weapon_aps).toBeGreaterThan(0);
        });
      }

      it("should have main skill ID", () => {
        const rustInput = convertToRustInput(
          parsed.stats,
          parsed.items,
          parsed.skills,
          emptyTree,
          mockParseStatLine,
        );
        expect(rustInput.main_skill_id).toBeTruthy();
      });

      it("should produce pool modifiers from items", () => {
        const rustInput = convertToRustInput(
          parsed.stats,
          parsed.items,
          parsed.skills,
          emptyTree,
          mockParseStatLine,
        );
        const lifeMods = rustInput.modifiers.filter(
          (m) => m.stat === "Life" && m.mod_type === "flat",
        );
        const esMods = rustInput.modifiers.filter(
          (m) => m.stat === "EnergyShield" && m.mod_type === "flat",
        );
        const totalPool = lifeMods.reduce((s, m) => s + m.value, 0)
          + esMods.reduce((s, m) => s + m.value, 0);
        expect(totalPool).toBeGreaterThan(50);
      });

      it("should produce resistance modifiers from items", () => {
        const rustInput = convertToRustInput(
          parsed.stats,
          parsed.items,
          parsed.skills,
          emptyTree,
          mockParseStatLine,
        );
        const resMods = rustInput.modifiers.filter(
          (m) =>
            m.stat === "FireRes" ||
            m.stat === "ColdRes" ||
            m.stat === "LightningRes",
        );
        expect(resMods.length).toBeGreaterThan(0);
      });
    });
  }
});
