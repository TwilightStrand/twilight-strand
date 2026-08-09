import { describe, it, expect } from "vitest";
import { calculateBuildScore } from "../build-score";
import type { BuildStats } from "@/engine/types";

function makeStats(overrides: Partial<BuildStats>): BuildStats {
  return {
    total_dps: 0, combined_dps: 0, full_dps: 0, total_ehp: 0,
    life: 1, energy_shield: 0, mana: 50,
    strength: 20, dexterity: 20, intelligence: 20,
    armour: 0, evasion: 0, evade_chance: 0,
    block_chance: 0, spell_block: 0, suppression: 0, phys_reduction: 0,
    fire_res: -60, cold_res: -60, lightning_res: -60, chaos_res: -60,
    fire_res_max: 75, cold_res_max: 75, lightning_res_max: 75, chaos_res_max: 75,
    life_regen: 0, mana_regen: 0, crit_chance: 0, crit_multiplier: 150,
    attack_speed: 1, hit_chance: 0, accuracy: 0,
    class_name: "Scion", ascendancy: "", level: 1,
    allocated_nodes: [], main_socket_group: 0,
    ward: 0, total_dps_with_minions: 0, bleed_dps: 0, poison_dps: 0,
    ignite_dps: 0, impale_dps: 0, life_leech_rate: 0, es_leech_rate: 0,
    mana_unreserved: 50, life_unreserved: 1, mana_reserved_percent: 0,
    es_regen: 0, es_recharge_rate: 0, tree_version: "3_29",
    ...overrides,
  };
}

describe("build-score", () => {
  it("should give low score to default build", () => {
    const result = calculateBuildScore(makeStats({}));
    expect(result.grade).toBe("F");
    expect(result.score).toBeLessThan(25);
  });

  it("should give higher score to a geared build", () => {
    const result = calculateBuildScore(makeStats({
      total_dps: 1000000,
      total_ehp: 50000,
      fire_res: 75,
      cold_res: 75,
      lightning_res: 75,
      block_chance: 50,
      phys_reduction: 30,
    }));
    expect(result.score).toBeGreaterThan(60);
    expect(["A", "S"]).toContain(result.grade);
  });

  it("should cap at 100", () => {
    const result = calculateBuildScore(makeStats({
      total_dps: 100000000,
      total_ehp: 1000000,
      fire_res: 90, cold_res: 90, lightning_res: 90,
      block_chance: 75, spell_block: 75, suppression: 100, phys_reduction: 90,
    }));
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("should have four breakdown categories", () => {
    const result = calculateBuildScore(makeStats({ total_dps: 500000, life: 5000, fire_res: 75, cold_res: 75, lightning_res: 75 }));
    expect(result.breakdown.dps).toBeDefined();
    expect(result.breakdown.survivability).toBeDefined();
    expect(result.breakdown.resistances).toBeDefined();
    expect(result.breakdown.mitigation).toBeDefined();
  });

  it("should return valid grades", () => {
    const validGrades = ["S", "A", "B", "C", "D", "F"];
    const result = calculateBuildScore(makeStats({}));
    expect(validGrades).toContain(result.grade);
  });
});
