import { describe, it, expect } from "vitest";
import { getStatSources, type StatSource } from "../stat-sources";
import type { BuildStats, ItemData } from "@/engine/types";

function makeStats(overrides: Partial<BuildStats> = {}): BuildStats {
  return {
    level: 90,
    class_name: "Witch",
    ascendancy: "Occultist",
    life: 4000,
    energy_shield: 8000,
    mana: 1200,
    strength: 50,
    dexterity: 40,
    intelligence: 300,
    fire_res: 75,
    cold_res: 75,
    lightning_res: 75,
    chaos_res: -60,
    armour: 0,
    evasion: 0,
    evade_chance: 0,
    block_chance: 0,
    spell_block: 0,
    suppression: 0,
    attack_speed: 1.5,
    crit_chance: 7.0,
    crit_multiplier: 150,
    accuracy: 1000,
    total_dps: 0,
    combined_dps: 0,
    full_dps: 0,
    total_ehp: 20000,
    hit_chance: 100,
    fire_res_max: 75,
    cold_res_max: 75,
    lightning_res_max: 75,
    chaos_res_max: 75,
    phys_reduction: 0,
    bleed_dps: 0,
    ignite_dps: 0,
    poison_dps: 0,
    impale_dps: 0,
    life_regen: 0,
    mana_regen: 0,
    mana_unreserved: 0,
    life_unreserved: 0,
    mana_reserved_percent: 0,
    ward: 0,
    total_dps_with_minions: 0,
    life_leech_rate: 0,
    es_leech_rate: 0,
    es_regen: 0,
    es_recharge_rate: 0,
    allocated_nodes: [],
    main_socket_group: 1,
    tree_version: "3_29",
    ...overrides,
  } as BuildStats;
}

function makeItem(name: string, mods: string[]): ItemData {
  return { name, base: "", slot: name, mods, quality: 0, sockets: "" } as ItemData;
}

describe("getStatSources", () => {
  describe("life", () => {
    it("includes base life from level", () => {
      const stats = makeStats({ level: 90 });
      const sources = getStatSources("life", stats, []);
      const base = sources.find((s) => s.type === "base");
      expect(base).toBeDefined();
      expect(base!.value).toBe(`${38 + 89 * 12}`);
    });

    it("includes strength contribution", () => {
      const stats = makeStats({ strength: 200 });
      const sources = getStatSources("life", stats, []);
      const strSource = sources.find((s) => s.source.includes("Strength"));
      expect(strSource).toBeDefined();
      expect(strSource!.value).toBe("+100");
    });

    it("extracts flat life from item mods", () => {
      const items = [makeItem("Helmet", ["+80 to maximum life"])];
      const sources = getStatSources("life", makeStats(), items);
      const itemSource = sources.find((s) => s.source === "Helmet" && s.type === "flat");
      expect(itemSource).toBeDefined();
      expect(itemSource!.value).toBe("+80");
    });

    it("extracts increased life from item mods", () => {
      const items = [makeItem("Belt", ["12% increased maximum life"])];
      const sources = getStatSources("life", makeStats(), items);
      const itemSource = sources.find((s) => s.source === "Belt" && s.type === "increased");
      expect(itemSource).toBeDefined();
      expect(itemSource!.value).toBe("+12");
    });
  });

  describe("mana", () => {
    it("includes base mana from level", () => {
      const sources = getStatSources("mana", makeStats({ level: 90 }), []);
      const base = sources.find((s) => s.type === "base");
      expect(base).toBeDefined();
      expect(base!.value).toBe(`${34 + 89 * 6}`);
    });

    it("includes intelligence contribution", () => {
      const stats = makeStats({ intelligence: 300 });
      const sources = getStatSources("mana", stats, []);
      const intSource = sources.find((s) => s.source.includes("Intelligence"));
      expect(intSource).toBeDefined();
      expect(intSource!.value).toBe("+150");
    });
  });

  describe("resistances", () => {
    it("includes act 10 penalty for elemental resistances", () => {
      for (const key of ["fire_res", "cold_res", "lightning_res"]) {
        const sources = getStatSources(key, makeStats(), []);
        const penalty = sources.find((s) => s.source === "Act 10 Penalty");
        expect(penalty).toBeDefined();
        expect(penalty!.value).toBe("-60%");
      }
    });

    it("includes act 10 penalty for chaos resistance", () => {
      const sources = getStatSources("chaos_res", makeStats(), []);
      const penalty = sources.find((s) => s.source === "Act 10 Penalty");
      expect(penalty).toBeDefined();
      expect(penalty!.value).toBe("-60%");
    });

    it("extracts fire resistance from item mods", () => {
      const items = [makeItem("Ring", ["+40% to fire resistance"])];
      const sources = getStatSources("fire_res", makeStats(), items);
      const itemSource = sources.find((s) => s.source === "Ring");
      expect(itemSource).toBeDefined();
      expect(itemSource!.value).toContain("40");
    });

    it("extracts all-elemental resistance and applies to each element", () => {
      const items = [makeItem("Amulet", ["+15% to all elemental resistances"])];
      for (const key of ["fire_res", "cold_res", "lightning_res"]) {
        const sources = getStatSources(key, makeStats(), items);
        const itemSource = sources.find((s) => s.source === "Amulet");
        expect(itemSource).toBeDefined();
      }
    });
  });

  describe("attributes", () => {
    it("extracts flat strength from items", () => {
      const items = [makeItem("Belt", ["+50 to strength"])];
      const sources = getStatSources("strength", makeStats(), items);
      const itemSource = sources.find((s) => s.source === "Belt");
      expect(itemSource).toBeDefined();
      expect(itemSource!.value).toBe("+50");
    });

    it("extracts all attributes from items", () => {
      const items = [makeItem("Amulet", ["+10 to all attributes"])];
      for (const key of ["strength", "dexterity", "intelligence"]) {
        const sources = getStatSources(key, makeStats(), items);
        const itemSource = sources.find((s) => s.source === "Amulet");
        expect(itemSource).toBeDefined();
      }
    });
  });

  describe("armour / evasion", () => {
    it("extracts flat and increased armour from items", () => {
      const items = [makeItem("Chest", ["+500 to armour", "120% increased armour"])];
      const sources = getStatSources("armour", makeStats(), items);
      const flat = sources.find((s) => s.type === "flat");
      const inc = sources.find((s) => s.type === "increased");
      expect(flat).toBeDefined();
      expect(flat!.value).toBe("+500");
      expect(inc).toBeDefined();
      expect(inc!.value).toBe("+120");
    });
  });

  it("returns empty sources for unknown stat keys", () => {
    const sources = getStatSources("nonexistent_stat", makeStats(), []);
    expect(sources).toEqual([]);
  });

  it("handles items with no matching mods", () => {
    const items = [makeItem("Ring", ["Adds 10 to 20 Fire Damage to Attacks"])];
    const sources = getStatSources("life", makeStats(), items);
    const itemSources = sources.filter((s) => s.source === "Ring");
    expect(itemSources).toHaveLength(0);
  });
});
