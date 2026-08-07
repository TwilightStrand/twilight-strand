import { describe, it, expect } from "vitest";
import { convertToRustInput, compareLuaVsRust, rustOutputToBuildStats } from "../rust-converter";
import type { BuildStats, ItemData, SkillGroup } from "../types";
import type { RustCalcOutput } from "../rust-bridge";
import type { TreeNode } from "@/components/tree/tree-data";

function mockTreeNodes(entries: Array<{ id: string; stats?: string[]; isKeystone?: boolean; name?: string }>): Map<string, TreeNode> {
  const map = new Map<string, TreeNode>();
  for (const e of entries) {
    map.set(e.id, {
      id: e.id,
      name: e.name,
      stats: e.stats,
      isKeystone: e.isKeystone,
      group: 0, orbit: 0, orbitIndex: 0,
      out: [], in: [], x: 0, y: 0,
    });
  }
  return map;
}

const baseStats: BuildStats = {
  total_dps: 0, combined_dps: 0, full_dps: 0, total_ehp: 0,
  life: 1000, energy_shield: 0, mana: 500,
  strength: 50, dexterity: 30, intelligence: 30,
  armour: 0, evasion: 0, evade_chance: 0,
  block_chance: 0, spell_block: 0, suppression: 0, phys_reduction: 0,
  fire_res: -60, cold_res: -60, lightning_res: -60, chaos_res: -60,
  fire_res_max: 75, cold_res_max: 75, lightning_res_max: 75, chaos_res_max: 75,
  life_regen: 0, mana_regen: 0,
  crit_chance: 5, crit_multiplier: 150, attack_speed: 1.2,
  hit_chance: 80, accuracy: 200,
  class_name: "Marauder", ascendancy: "Juggernaut",
  level: 90, allocated_nodes: [1001, 1002, 1003],
  main_socket_group: 1, tree_version: "3_29",
  mana_unreserved: 500, life_unreserved: 1000,
  mana_reserved_percent: 0, ward: 0,
  total_dps_with_minions: 0,
  bleed_dps: 0, poison_dps: 0, ignite_dps: 0, impale_dps: 0,
  life_leech_rate: 0, es_leech_rate: 0,
  es_regen: 0, es_recharge_rate: 0,
};

describe("rust-converter", () => {
  describe("convertToRustInput", () => {
    it("should extract basic build info", () => {
      const result = convertToRustInput(baseStats, [], [], mockTreeNodes([]));
      expect(result.level).toBe(90);
      expect(result.class_id).toBe(1); // Marauder
      expect(result.ascendancy_name).toBe("Juggernaut");
    });

    it("should collect item mods as stat_lines", () => {
      const items: ItemData[] = [
        { slot: "Body Armour", name: "Kaom's Heart", base: "Glorious Plate", rarity: "Unique", mods: ["+500 to maximum Life"], quality: 0, sockets: "" },
        { slot: "Ring 1", name: "Coral Ring", base: "Coral Ring", rarity: "Rare", mods: ["+40 to maximum Life", "+30% to Fire Resistance"], quality: 0, sockets: "" },
      ];
      const result = convertToRustInput(baseStats, items, [], mockTreeNodes([]));
      expect(result.stat_lines).toContain("+500 to maximum Life");
      expect(result.stat_lines).toContain("+40 to maximum Life");
      expect(result.stat_lines).toContain("+30% to Fire Resistance");
      expect(result.modifiers).toHaveLength(0);
    });

    it("should detect unique items", () => {
      const items: ItemData[] = [
        { slot: "Body Armour", name: "Kaom's Heart", base: "Glorious Plate", rarity: "Unique", mods: [], quality: 0, sockets: "" },
        { slot: "Helmet", name: "Rare Helm", base: "Lion Pelt", rarity: "Rare", mods: [], quality: 0, sockets: "" },
      ];
      const result = convertToRustInput(baseStats, items, [], mockTreeNodes([]));
      expect(result.equipped_uniques).toEqual(["Kaom's Heart"]);
    });

    it("should extract support gems from main skill group", () => {
      const skills: SkillGroup[] = [
        {
          slot: "Body Armour", enabled: true, label: "Ground Slam",
          gems: [
            { name: "Ground Slam", level: 20, quality: 20, enabled: true, skillId: "GroundSlam", isSupport: false },
            { name: "Melee Physical Damage Support", level: 20, quality: 20, enabled: true, skillId: "SupportMeleePhysicalDamage", isSupport: true },
            { name: "Faster Attacks Support", level: 20, quality: 20, enabled: true, skillId: "SupportFasterAttacks", isSupport: true },
          ],
        },
      ];
      const result = convertToRustInput(baseStats, [], skills, mockTreeNodes([]));
      expect(result.main_skill_id).toBe("GroundSlam");
      expect(result.support_gems).toContain("Melee Physical Damage Support");
      expect(result.support_gems).toContain("Faster Attacks Support");
      expect(result.support_gems).toHaveLength(2);
    });

    it("should collect tree node stats as stat_lines and detect keystones", () => {
      const treeNodes = mockTreeNodes([
        { id: "1001", stats: ["+10 to Strength", "8% increased maximum Life"], name: "Life Node" },
        { id: "1002", stats: ["+30% to Fire Resistance"], name: "Res Node" },
        { id: "1003", stats: [], isKeystone: true, name: "Chaos Inoculation" },
      ]);
      const result = convertToRustInput(baseStats, [], [], treeNodes);
      expect(result.allocated_keystones).toContain("Chaos Inoculation");
      expect(result.stat_lines).toContain("+10 to Strength");
      expect(result.stat_lines).toContain("8% increased maximum Life");
      expect(result.stat_lines).toContain("+30% to Fire Resistance");
    });

    it("should detect flasks from flask slots", () => {
      const items: ItemData[] = [
        { slot: "Flask 1", name: "Diamond Flask", base: "Diamond Flask", rarity: "Normal", mods: [], quality: 0, sockets: "" },
        { slot: "Flask 3", name: "Bottled Faith", base: "Sulphur Flask", rarity: "Unique", mods: [], quality: 0, sockets: "" },
      ];
      const result = convertToRustInput(baseStats, items, [], mockTreeNodes([]));
      expect(result.active_flasks).toContain("Diamond Flask");
      expect(result.active_flasks).toContain("Bottled Faith");
    });

    it("should handle disabled gems", () => {
      const skills: SkillGroup[] = [
        {
          slot: "Body Armour", enabled: true, label: "Ground Slam",
          gems: [
            { name: "Ground Slam", level: 20, quality: 20, enabled: true, skillId: "GroundSlam", isSupport: false },
            { name: "Disabled Support", level: 20, quality: 20, enabled: false, skillId: "SupportDisabled", isSupport: true },
          ],
        },
      ];
      const result = convertToRustInput(baseStats, [], skills, mockTreeNodes([]));
      expect(result.support_gems).toHaveLength(0);
    });
  });

  describe("compareLuaVsRust", () => {
    it("should compute divergences for matching values", () => {
      const rust: Record<string, number> = { life: 1000, mana: 500, fire_res: -60 };
      const divergences = compareLuaVsRust(baseStats, rust);
      const lifeDivergence = divergences.find(d => d.stat === "Life");
      expect(lifeDivergence).toBeDefined();
      expect(lifeDivergence!.pctDiff).toBe(0);
    });

    it("should detect divergences", () => {
      const rust: Record<string, number> = { life: 1200, mana: 500 };
      const divergences = compareLuaVsRust(baseStats, rust);
      const lifeDivergence = divergences.find(d => d.stat === "Life");
      expect(lifeDivergence).toBeDefined();
      expect(lifeDivergence!.diff).toBe(200);
      expect(lifeDivergence!.pctDiff).toBe(20);
    });
  });

  describe("rustOutputToBuildStats", () => {
    it("should merge Rust output into BuildStats preserving non-overlapping fields", () => {
      const rust: RustCalcOutput = {
        life: 5000, energy_shield: 100, mana: 600,
        strength: 200, dexterity: 50, intelligence: 40,
        armour: 3000, evasion: 500,
        fire_res: 75, cold_res: 60, lightning_res: 55, chaos_res: -30,
        block_chance: 30, spell_block: 10,
        total_dps: 50000, crit_chance: 45, crit_multiplier: 400,
        attack_speed: 3.5, accuracy: 2000, hit_chance: 95,
        total_ehp: 80000,
        bleed_dps: 1000, poison_dps: 0, ignite_dps: 5000,
        combined_dps: 56000,
        life_regen: 200, mana_regen: 50, es_regen: 0,
        evade_chance: 15, phys_reduction: 25, suppression: 60,
        trigger_rate: 0, total_dps_with_minions: 50000,
        mana_unreserved: 600, life_unreserved: 5000,
        mana_reserved_percent: 0, life_leech_rate: 0, es_leech_rate: 0,
        impale_dps: 0,
        ward: 0,
        es_recharge_rate: 0,
      };
      const merged = rustOutputToBuildStats(baseStats, rust);
      expect(merged.life).toBe(5000);
      expect(merged.class_name).toBe("Marauder");
      expect(merged.ascendancy).toBe("Juggernaut");
      expect(merged.level).toBe(90);
      expect(merged.allocated_nodes).toEqual([1001, 1002, 1003]);
      expect(merged.total_dps).toBe(50000);
      expect(merged.bleed_dps).toBe(1000);
    });
  });
});
