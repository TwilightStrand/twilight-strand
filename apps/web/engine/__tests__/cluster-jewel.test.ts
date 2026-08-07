import { describe, it, expect } from "vitest";
import { parseClusterJewel } from "../cluster-jewel";

describe("parseClusterJewel", () => {
  it("returns null when no passive count mod found", () => {
    expect(parseClusterJewel(["some random mod"])).toBeNull();
    expect(parseClusterJewel([])).toBeNull();
  });

  it("parses a large cluster jewel with notables", () => {
    const mods = [
      "Adds 12 Passive Skills",
      "1 Added Passive Skill is Fuel the Fight",
      "1 Added Passive Skill is Feed the Fury",
      "Added Small Passive Skills grant: 12% increased Physical Damage",
      "Large Cluster Jewel",
    ];

    const result = parseClusterJewel(mods);
    expect(result).not.toBeNull();
    expect(result!.passiveCount).toBe(12);
    expect(result!.baseType).toBe("Large Cluster Jewel");
    expect(result!.notableNames).toEqual(["Fuel the Fight", "Feed the Fury"]);
    expect(result!.smallPassiveStats).toEqual(["12% increased Physical Damage"]);
    expect(result!.enchant).toBe("Adds 12 Passive Skills");
  });

  it("parses a medium cluster jewel", () => {
    const mods = [
      "Adds 5 Passive Skills",
      "1 Added Passive Skill is Lasting Impression",
      "Medium Cluster Jewel",
    ];

    const result = parseClusterJewel(mods);
    expect(result).not.toBeNull();
    expect(result!.passiveCount).toBe(5);
    expect(result!.baseType).toBe("Medium Cluster Jewel");
    expect(result!.notableNames).toEqual(["Lasting Impression"]);
  });

  it("parses a small cluster jewel", () => {
    const mods = [
      "Adds 2 Passive Skills",
      "1 Added Passive Skill is Fettle",
      "Added Small Passive Skills grant: 6% increased maximum Life",
      "Small Cluster Jewel",
    ];

    const result = parseClusterJewel(mods);
    expect(result).not.toBeNull();
    expect(result!.passiveCount).toBe(2);
    expect(result!.baseType).toBe("Small Cluster Jewel");
  });

  it("generates correct node layout for large cluster (12 passives)", () => {
    const mods = [
      "Adds 12 Passive Skills",
      "1 Added Passive Skill is Notable A",
      "1 Added Passive Skill is Notable B",
      "Large Cluster Jewel",
    ];

    const result = parseClusterJewel(mods)!;
    expect(result.nodes).toHaveLength(12);

    const lastNode = result.nodes[11];
    expect(lastNode.type).toBe("socket");
    expect(lastNode.name).toBe("Jewel Socket");

    const notables = result.nodes.filter((n) => n.type === "notable");
    expect(notables).toHaveLength(2);

    const smalls = result.nodes.filter((n) => n.type === "small");
    expect(smalls.length).toBe(12 - 2 - 1);
  });

  it("generates correct node layout for small cluster (2 passives)", () => {
    const mods = [
      "Adds 2 Passive Skills",
      "1 Added Passive Skill is Fettle",
    ];

    const result = parseClusterJewel(mods)!;
    expect(result.nodes).toHaveLength(2);

    const notable = result.nodes.find((n) => n.type === "notable");
    expect(notable).toBeDefined();
    expect(notable!.name).toBe("Fettle");
    expect(notable!.position).toBe(1);
  });

  it("does not place socket on clusters with fewer than 8 passives", () => {
    const mods = ["Adds 4 Passive Skills", "1 Added Passive Skill is X"];

    const result = parseClusterJewel(mods)!;
    const sockets = result.nodes.filter((n) => n.type === "socket");
    expect(sockets).toHaveLength(0);
  });

  it("small passive nodes carry the small passive stats", () => {
    const mods = [
      "Adds 5 Passive Skills",
      "Added Small Passive Skills grant: 10% increased Damage",
      "Medium Cluster Jewel",
    ];

    const result = parseClusterJewel(mods)!;
    const smalls = result.nodes.filter((n) => n.type === "small");
    for (const node of smalls) {
      expect(node.stats).toEqual(["10% increased Damage"]);
    }
  });

  it("singular passive skill pattern works", () => {
    const mods = ["Adds 1 Passive Skill"];
    const result = parseClusterJewel(mods);
    expect(result).not.toBeNull();
    expect(result!.passiveCount).toBe(1);
  });

  it("defaults baseType when no size keyword present", () => {
    const mods = ["Adds 4 Passive Skills"];
    const result = parseClusterJewel(mods)!;
    expect(result.baseType).toBe("Cluster Jewel");
  });
});
