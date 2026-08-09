import { describe, it, expect } from "vitest";
import { convertToRustInput } from "../rust-converter";
import type { BuildStats, ItemData, SkillGroup } from "../types";
import type { TreeNode } from "@/components/tree/tree-data";

function mockTreeNodes(entries: Array<{ id: string; stats?: string[]; isKeystone?: boolean; name?: string }>): Map<string, TreeNode> {
  const map = new Map<string, TreeNode>();
  for (const e of entries) {
    map.set(e.id, {
      id: e.id, name: e.name, stats: e.stats, isKeystone: e.isKeystone,
      group: 0, orbit: 0, orbitIndex: 0, out: [], in: [], x: 0, y: 0,
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
  level: 90, allocated_nodes: [],
  main_socket_group: 1, tree_version: "3_29",
  mana_unreserved: 500, life_unreserved: 1000,
  mana_reserved_percent: 0, ward: 0,
  total_dps_with_minions: 0,
  bleed_dps: 0, poison_dps: 0, ignite_dps: 0, impale_dps: 0,
  life_leech_rate: 0, es_leech_rate: 0,
  es_regen: 0, es_recharge_rate: 0,
};

function makeItem(slot: string, overrides: Partial<ItemData> = {}): ItemData {
  return {
    slot, name: "", base: "", rarity: "Rare",
    mods: [], quality: 0, sockets: "", ...overrides,
  };
}

describe("rust-converter: weapon stats", () => {
  it("extracts weapon physical damage range", () => {
    const items = [makeItem("Weapon 1", {
      base: "Vaal Axe",
      mods: ["Adds 150 to 280 Physical Damage", "1.30 Attacks per Second", "6.50% Critical Strike Chance"],
    })];

    const result = convertToRustInput(baseStats, items, [], mockTreeNodes([]));
    expect(result.weapon_phys_min).toBe(150);
    expect(result.weapon_phys_max).toBe(280);
    expect(result.weapon_aps).toBe(1.30);
    expect(result.weapon_crit).toBe(6.50);
    expect(result.weapon_base_type).toBe("Vaal Axe");
  });

  it("detects dual wield", () => {
    const items = [
      makeItem("Weapon 1", { base: "Claw", mods: ["Adds 50 to 100 Physical Damage", "1.50 Attacks per Second"] }),
      makeItem("Weapon 2", { base: "Claw", mods: ["Adds 40 to 80 Physical Damage", "1.60 Attacks per Second"] }),
    ];

    const result = convertToRustInput(baseStats, items, [], mockTreeNodes([]));
    expect(result.is_dual_wield).toBe(true);
    expect(result.weapon2_phys_min).toBe(40);
    expect(result.weapon2_phys_max).toBe(80);
  });

  it("not dual wield when only one weapon", () => {
    const items = [makeItem("Weapon 1", {
      base: "Sword", mods: ["Adds 50 to 100 Physical Damage", "1.50 Attacks per Second"],
    })];

    const result = convertToRustInput(baseStats, items, [], mockTreeNodes([]));
    expect(result.is_dual_wield).toBe(false);
  });

  it("defaults weapon stats when no weapon equipped", () => {
    const result = convertToRustInput(baseStats, [], [], mockTreeNodes([]));
    expect(result.weapon_phys_min).toBe(0);
    expect(result.weapon_phys_max).toBe(0);
    expect(result.weapon_aps).toBe(0);
    expect(result.weapon_base_type).toBe("");
  });
});

describe("rust-converter: gear defence aggregation", () => {
  it("sums armour, evasion, ES across gear pieces", () => {
    const items = [
      makeItem("Body Armour", { baseArmour: 1500, baseES: 100 }),
      makeItem("Helmet", { baseArmour: 400 }),
      makeItem("Gloves", { baseEvasion: 200, baseES: 50 }),
      makeItem("Boots", { baseEvasion: 300 }),
    ];

    const result = convertToRustInput(baseStats, items, [], mockTreeNodes([]));
    // gear defences are set to 0 to avoid local-mod double-scaling;
    // defence values flow through stat_lines instead
    expect(result.gear_armour).toBe(0);
    expect(result.gear_evasion).toBe(0);
    expect(result.gear_es).toBe(0);
  });

  it("excludes flasks from gear defence totals", () => {
    const items = [
      makeItem("Body Armour", { baseArmour: 1000 }),
      makeItem("Flask 1", { baseArmour: 999 }),
    ];

    const result = convertToRustInput(baseStats, items, [], mockTreeNodes([]));
    expect(result.gear_armour).toBe(0);
  });

  it("sums block chance from shields", () => {
    const items = [makeItem("Weapon 2", { baseBlock: 30 })];
    const result = convertToRustInput(baseStats, items, [], mockTreeNodes([]));
    expect(result.gear_block).toBe(30);
  });
});

describe("rust-converter: aura-conditional mod filtering", () => {
  it("includes 'while affected by' mod when aura is active", () => {
    const items = [makeItem("Ring 1", {
      mods: ["+20% to Fire Resistance while affected by Anger"],
    })];
    const skills: SkillGroup[] = [{
      slot: "Body Armour", enabled: true, label: "Anger",
      gems: [{ name: "Anger", level: 20, quality: 0, enabled: true, skillId: "Anger", isSupport: false }],
    }];

    const result = convertToRustInput(baseStats, items, skills, mockTreeNodes([]));
    expect(result.stat_lines).toContain("+20% to Fire Resistance");
  });

  it("excludes 'while affected by' mod when aura is not active", () => {
    const items = [makeItem("Ring 1", {
      mods: ["+20% to Fire Resistance while affected by Anger"],
    })];

    const result = convertToRustInput(baseStats, items, [], mockTreeNodes([]));
    expect(result.stat_lines).not.toContain("+20% to Fire Resistance");
  });

  it("passes through non-conditional mods normally", () => {
    const items = [makeItem("Ring 1", {
      mods: ["+40 to maximum Life", "+30% to Fire Resistance"],
    })];

    const result = convertToRustInput(baseStats, items, [], mockTreeNodes([]));
    expect(result.stat_lines).toContain("+40 to maximum Life");
    expect(result.stat_lines).toContain("+30% to Fire Resistance");
  });
});

describe("rust-converter: class ID mapping", () => {
  it("maps all seven base classes correctly", () => {
    const cases: [string, number][] = [
      ["Scion", 0], ["Marauder", 1], ["Ranger", 2],
      ["Witch", 3], ["Duelist", 4], ["Templar", 5], ["Shadow", 6],
    ];

    for (const [className, expected] of cases) {
      const stats = { ...baseStats, class_name: className };
      const result = convertToRustInput(stats, [], [], mockTreeNodes([]));
      expect(result.class_id).toBe(expected);
    }
  });

  it("defaults to 0 for unknown class names", () => {
    const stats = { ...baseStats, class_name: "UnknownClass" };
    const result = convertToRustInput(stats, [], [], mockTreeNodes([]));
    expect(result.class_id).toBe(0);
  });
});

describe("rust-converter: flask detection", () => {
  it("collects flasks from all flask slots", () => {
    const items = [
      makeItem("Flask 1", { name: "Diamond Flask" }),
      makeItem("Flask 2", { name: "Ruby Flask" }),
      makeItem("Flask 3", { name: "", base: "Quicksilver Flask" }),
    ];

    const result = convertToRustInput(baseStats, items, [], mockTreeNodes([]));
    expect(result.active_flasks).toHaveLength(3);
    expect(result.active_flasks).toContain("Diamond Flask");
    expect(result.active_flasks).toContain("Ruby Flask");
    expect(result.active_flasks).toContain("Quicksilver Flask");
  });
});

describe("rust-converter: main skill group selection", () => {
  it("uses mainSocketGroup index to select active skill", () => {
    const skills: SkillGroup[] = [
      {
        slot: "Helmet", enabled: true, label: "Aura",
        gems: [{ name: "Determination", level: 20, quality: 0, enabled: true, skillId: "Determination", isSupport: false }],
      },
      {
        slot: "Body Armour", enabled: true, label: "Main",
        gems: [
          { name: "Cyclone", level: 21, quality: 23, enabled: true, skillId: "Cyclone", isSupport: false },
          { name: "Melee Physical Damage Support", level: 20, quality: 20, enabled: true, skillId: "SupportMeleePhysicalDamage", isSupport: true },
        ],
      },
    ];
    const stats = { ...baseStats, main_socket_group: 2 };

    const result = convertToRustInput(stats, [], skills, mockTreeNodes([]));
    expect(result.main_skill_id).toBe("Cyclone");
    expect(result.support_gems).toContain("Melee Physical Damage Support");
  });

  it("defaults to first group when mainSocketGroup is 0", () => {
    const skills: SkillGroup[] = [{
      slot: "Helmet", enabled: true, label: "Grace",
      gems: [{ name: "Grace", level: 20, quality: 0, enabled: true, skillId: "Grace", isSupport: false }],
    }];
    const stats = { ...baseStats, main_socket_group: 0 };

    const result = convertToRustInput(stats, [], skills, mockTreeNodes([]));
    expect(result.main_skill_id).toBe("Grace");
  });
});

describe("rust-converter: gem levels", () => {
  it("extracts main skill level from gem data", () => {
    const skills: SkillGroup[] = [{
      slot: "Body Armour", enabled: true, label: "Main",
      gems: [
        { name: "Fireball", level: 21, quality: 23, enabled: true, skillId: "Fireball", isSupport: false },
        { name: "Faster Casting Support", level: 19, quality: 20, enabled: true, skillId: "SupportFasterCasting", isSupport: true },
      ],
    }];
    const result = convertToRustInput(baseStats, [], skills, mockTreeNodes([]));
    expect(result.main_skill_level).toBe(21);
  });

  it("extracts support gem levels parallel to support_gems", () => {
    const skills: SkillGroup[] = [{
      slot: "Body Armour", enabled: true, label: "Main",
      gems: [
        { name: "Ground Slam", level: 20, quality: 0, enabled: true, skillId: "GroundSlam", isSupport: false },
        { name: "Melee Physical Damage Support", level: 21, quality: 20, enabled: true, skillId: "SupportMeleePhys", isSupport: true },
        { name: "Faster Attacks Support", level: 18, quality: 10, enabled: true, skillId: "SupportFasterAttacks", isSupport: true },
      ],
    }];
    const result = convertToRustInput(baseStats, [], skills, mockTreeNodes([]));
    expect(result.support_gem_levels).toEqual([21, 18]);
    expect(result.support_gems).toEqual(["Melee Physical Damage Support", "Faster Attacks Support"]);
  });

  it("defaults to 20 when gem level is 0 or missing", () => {
    const skills: SkillGroup[] = [{
      slot: "Body Armour", enabled: true, label: "Main",
      gems: [
        { name: "Fireball", level: 0, quality: 0, enabled: true, skillId: "Fireball", isSupport: false },
      ],
    }];
    const result = convertToRustInput(baseStats, [], skills, mockTreeNodes([]));
    expect(result.main_skill_level).toBe(20);
  });
});

describe("rust-converter: socket groups", () => {
  it("builds socket groups from all enabled skill groups", () => {
    const skills: SkillGroup[] = [
      {
        slot: "Body Armour", enabled: true, label: "Main",
        gems: [
          { name: "Ground Slam", level: 20, quality: 0, enabled: true, skillId: "GroundSlam", isSupport: false },
          { name: "Brutality Support", level: 20, quality: 0, enabled: true, skillId: "SupportBrutality", isSupport: true },
        ],
      },
      {
        slot: "Helmet", enabled: true, label: "Aura",
        gems: [
          { name: "Hatred", level: 20, quality: 0, enabled: true, skillId: "Hatred", isSupport: false },
        ],
      },
    ];
    const result = convertToRustInput(baseStats, [], skills, mockTreeNodes([]));
    expect(result.socket_groups).toHaveLength(2);
    expect(result.socket_groups[0]).toEqual({
      active_skill: "GroundSlam",
      support_gems: ["Brutality Support"],
    });
    expect(result.socket_groups[1]).toEqual({
      active_skill: "Hatred",
      support_gems: [],
    });
  });

  it("skips disabled skill groups", () => {
    const skills: SkillGroup[] = [
      {
        slot: "Body Armour", enabled: true, label: "Main",
        gems: [
          { name: "Ground Slam", level: 20, quality: 0, enabled: true, skillId: "GroundSlam", isSupport: false },
        ],
      },
      {
        slot: "Helmet", enabled: false, label: "Disabled",
        gems: [
          { name: "Fireball", level: 20, quality: 0, enabled: true, skillId: "Fireball", isSupport: false },
        ],
      },
    ];
    const result = convertToRustInput(baseStats, [], skills, mockTreeNodes([]));
    expect(result.socket_groups).toHaveLength(1);
    expect(result.socket_groups[0].active_skill).toBe("GroundSlam");
  });

  it("skips disabled gems within a group", () => {
    const skills: SkillGroup[] = [{
      slot: "Body Armour", enabled: true, label: "Main",
      gems: [
        { name: "Ground Slam", level: 20, quality: 0, enabled: true, skillId: "GroundSlam", isSupport: false },
        { name: "Disabled Support", level: 20, quality: 0, enabled: false, skillId: "SupportDisabled", isSupport: true },
        { name: "Enabled Support", level: 20, quality: 0, enabled: true, skillId: "SupportEnabled", isSupport: true },
      ],
    }];
    const result = convertToRustInput(baseStats, [], skills, mockTreeNodes([]));
    expect(result.socket_groups[0].support_gems).toEqual(["Enabled Support"]);
  });
});

describe("rust-converter: config conditions", () => {
  it("maps config overrides to boolean fields", () => {
    const config: Record<string, boolean> = {
      conditionOnConsecratedGround: true,
      conditionEnemyIntimidated: true,
      conditionEnemyUnnerved: true,
      buffPhasing: true,
      buffElusive: true,
      conditionEnemyHindered: true,
      conditionBeenHitRecently: true,
      conditionUsedSkillRecently: true,
    };
    const result = convertToRustInput(baseStats, [], [], mockTreeNodes([]), config);
    expect(result.on_consecrated_ground).toBe(true);
    expect(result.enemy_intimidated).toBe(true);
    expect(result.enemy_unnerved).toBe(true);
    expect(result.have_phasing).toBe(true);
    expect(result.have_elusive).toBe(true);
    expect(result.enemy_hindered).toBe(true);
    expect(result.hit_recently_by_enemy).toBe(true);
    expect(result.used_skill_recently).toBe(true);
  });

  it("defaults new boolean fields to false when no config", () => {
    const result = convertToRustInput(baseStats, [], [], mockTreeNodes([]));
    expect(result.on_consecrated_ground).toBe(false);
    expect(result.enemy_intimidated).toBe(false);
    expect(result.enemy_unnerved).toBe(false);
    expect(result.have_phasing).toBe(false);
    expect(result.have_elusive).toBe(false);
    expect(result.enemy_hindered).toBe(false);
    expect(result.crit_in_past_8_seconds).toBe(false);
    expect(result.hit_recently_by_enemy).toBe(false);
    expect(result.used_skill_recently).toBe(false);
    expect(result.nearby_rare_or_unique).toBe(false);
  });

  it("maps buffOnslaught, buffTailwind, buffArcaneSurge from config", () => {
    const config: Record<string, boolean> = {
      buffOnslaught: true,
      buffTailwind: true,
      buffArcaneSurge: true,
    };
    const result = convertToRustInput(baseStats, [], [], mockTreeNodes([]), config);
    expect(result.have_onslaught).toBe(true);
    expect(result.have_tailwind).toBe(true);
    expect(result.have_arcane_surge).toBe(true);
  });

  it("maps buffFortification and conditionKilledRecently", () => {
    const config: Record<string, boolean> = {
      buffFortification: true,
      conditionKilledRecently: true,
    };
    const result = convertToRustInput(baseStats, [], [], mockTreeNodes([]), config);
    expect(result.have_fortify).toBe(true);
    expect(result.have_killed_recently).toBe(true);
  });

  it("maps conditionLeeching from config", () => {
    const config: Record<string, boolean> = {
      conditionLeeching: true,
    };
    const result = convertToRustInput(baseStats, [], [], mockTreeNodes([]), config);
    expect(result.is_leeching).toBe(true);
  });

  it("maps Champion intimidate as enemy_intimidated", () => {
    const config: Record<string, boolean> = {
      conditionChampionIntimidate: true,
    };
    const result = convertToRustInput(baseStats, [], [], mockTreeNodes([]), config);
    expect(result.enemy_intimidated).toBe(true);
  });

  it("maps conditionFullLife and conditionLowLife from config", () => {
    const lowLifeConfig: Record<string, boolean> = {
      conditionLowLife: true,
    };
    const result = convertToRustInput(baseStats, [], [], mockTreeNodes([]), lowLifeConfig);
    expect(result.on_low_life).toBe(true);
    expect(result.on_full_life).toBe(false);
  });
});
