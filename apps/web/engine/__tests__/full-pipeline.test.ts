import { describe, it, expect } from "vitest";
import { parsePobXml } from "../pob-xml-parser";
import { convertToRustInput } from "../rust-converter";
import type { TreeNode } from "@/components/tree/tree-data";
import { TEST_BUILDS } from "./fixtures/test-builds";

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

      it("should convert to RustBuildInput with stat_lines", () => {
        const rustInput = convertToRustInput(
          parsed.stats,
          parsed.items,
          parsed.skills,
          emptyTree,
        );

        expect(rustInput.level).toBe(build.expectedLevel);
        expect(rustInput.ascendancy_name).toBe(build.expectedAscendancy);
        expect(rustInput.stat_lines.length).toBeGreaterThan(0);
        expect(rustInput.support_gems.length).toBeGreaterThanOrEqual(build.minSupportGems);
      });

      it("should detect unique items", () => {
        const rustInput = convertToRustInput(
          parsed.stats,
          parsed.items,
          parsed.skills,
          emptyTree,
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
        );
        expect(rustInput.main_skill_id).toBeTruthy();
      });

      it("should collect item mods as stat_lines", () => {
        const rustInput = convertToRustInput(
          parsed.stats,
          parsed.items,
          parsed.skills,
          emptyTree,
        );
        expect(rustInput.stat_lines.length).toBeGreaterThan(0);
        const hasLifeLine = rustInput.stat_lines.some(
          (l) => l.toLowerCase().includes("life") || l.toLowerCase().includes("energy shield"),
        );
        expect(hasLifeLine).toBe(true);
      });

      it("should collect resistance stat lines from items", () => {
        const rustInput = convertToRustInput(
          parsed.stats,
          parsed.items,
          parsed.skills,
          emptyTree,
        );
        const hasResLine = rustInput.stat_lines.some(
          (l) => l.toLowerCase().includes("resistance"),
        );
        expect(hasResLine).toBe(true);
      });
    });
  }
});
