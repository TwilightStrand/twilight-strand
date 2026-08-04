import { describe, it, expect } from "vitest";
import { STAT_EXPLANATIONS } from "../stat-explanations";

describe("stat-explanations", () => {
  it("should have explanations for key stats", () => {
    expect(STAT_EXPLANATIONS["Skill DPS"]).toBeDefined();
    expect(STAT_EXPLANATIONS["Total EHP"]).toBeDefined();
    expect(STAT_EXPLANATIONS["Armour"]).toBeDefined();
  });

  it("should return non-empty strings", () => {
    for (const [, value] of Object.entries(STAT_EXPLANATIONS)) {
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it("should cover all sidebar sections", () => {
    expect(STAT_EXPLANATIONS["Crit Chance"]).toBeDefined();
    expect(STAT_EXPLANATIONS["Hit Chance"]).toBeDefined();
    expect(STAT_EXPLANATIONS["Evade"]).toBeDefined();
    expect(STAT_EXPLANATIONS["Suppression"]).toBeDefined();
    expect(STAT_EXPLANATIONS["Phys Reduction"]).toBeDefined();
  });
});
