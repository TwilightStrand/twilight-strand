import { describe, it, expect } from "vitest";
import { encodeBuild, decodeBuild, buildToXml, xmlToBuild, BinaryWriter, BinaryReader } from "./index";
import type { Build } from "./types";

const SAMPLE_BUILD: Build = {
  level: 95,
  className: "Duelist",
  ascendancy: "Slayer",
  mainSocketGroup: 1,
  treeVersion: "3_29",
  allocatedNodes: [4011, 6741, 14914, 26740, 33989],
  items: [
    {
      slot: "Weapon 1", name: "Starforge", base: "Infernal Sword", rarity: "Unique",
      mods: ["+600 to Physical Damage", "+100 to maximum Life", "5% increased Attack Speed"],
      quality: 20, sockets: "R-R-R-R-R-R",
    },
    {
      slot: "Body Armour", name: "Doom Shell", base: "Glorious Plate", rarity: "Rare",
      mods: ["+110 to maximum Life", "+40% to Fire Resistance", "+38% to Cold Resistance", "12% increased Armour and Evasion", "+42 to Strength"],
      quality: 0, sockets: "R-R-R-G-G-B",
    },
    {
      slot: "Helmet", name: "Apocalypse Crown", base: "Lion Pelt", rarity: "Rare",
      mods: ["+89 to maximum Life", "+42% to Fire Resistance", "+36% to Cold Resistance", "+30% to Lightning Resistance"],
      quality: 0, sockets: "",
    },
    {
      slot: "Flask 1", name: "Diamond Flask", base: "Diamond Flask", rarity: "Normal",
      mods: [], quality: 0, sockets: "",
    },
    {
      slot: "Flask 2", name: "Lion's Roar", base: "Granite Flask", rarity: "Unique",
      mods: [], quality: 0, sockets: "",
    },
  ],
  skills: [
    {
      slot: "Body Armour", enabled: true, label: "Cyclone",
      gems: [
        { name: "Cyclone", level: 21, quality: 20, enabled: true, skillId: "Cyclone", isSupport: false },
        { name: "Melee Physical Damage Support", level: 20, quality: 20, enabled: true, skillId: "SupportMeleePhysicalDamage", isSupport: true },
        { name: "Brutality Support", level: 20, quality: 20, enabled: true, skillId: "SupportBrutality", isSupport: true },
        { name: "Faster Attacks Support", level: 20, quality: 20, enabled: true, skillId: "SupportFasterAttacks", isSupport: true },
      ],
    },
    {
      slot: "Helmet", enabled: true, label: "Herald of Ash",
      gems: [
        { name: "Herald of Ash", level: 20, quality: 0, enabled: true, skillId: "HeraldOfAsh", isSupport: false },
      ],
    },
  ],
  config: [
    { key: "enemyIsBoss", value: "true" },
    { key: "usePowerCharges", value: "true" },
  ],
  notes: "Cyclone Slayer league starter. Farm with this, transition to crit at 90+.",
};

describe("BinaryWriter/Reader", () => {
  it("roundtrips varints", () => {
    const w = new BinaryWriter();
    w.writeVarint(0);
    w.writeVarint(127);
    w.writeVarint(128);
    w.writeVarint(16384);
    const r = new BinaryReader(w.toUint8Array());
    expect(r.readVarint()).toBe(0);
    expect(r.readVarint()).toBe(127);
    expect(r.readVarint()).toBe(128);
    expect(r.readVarint()).toBe(16384);
  });

  it("roundtrips strings", () => {
    const w = new BinaryWriter();
    w.writeString("Cyclone");
    w.writeString("");
    w.writeString("Melee Physical Damage Support");
    const r = new BinaryReader(w.toUint8Array());
    expect(r.readString()).toBe("Cyclone");
    expect(r.readString()).toBe("");
    expect(r.readString()).toBe("Melee Physical Damage Support");
  });
});

describe("encodeBuild / decodeBuild (lossless)", () => {
  it("roundtrips build metadata", () => {
    const decoded = decodeBuild(encodeBuild(SAMPLE_BUILD));
    expect(decoded.level).toBe(95);
    expect(decoded.className).toBe("Duelist");
    expect(decoded.ascendancy).toBe("Slayer");
    expect(decoded.mainSocketGroup).toBe(1);
    expect(decoded.treeVersion).toBe("3_29");
  });

  it("preserves tree nodes exactly", () => {
    const decoded = decodeBuild(encodeBuild(SAMPLE_BUILD));
    expect(decoded.allocatedNodes).toEqual([4011, 6741, 14914, 26740, 33989]);
  });

  it("preserves all items with mods", () => {
    const decoded = decodeBuild(encodeBuild(SAMPLE_BUILD));
    expect(decoded.items).toHaveLength(5);
    expect(decoded.items[0].name).toBe("Starforge");
    expect(decoded.items[0].rarity).toBe("Unique");
    expect(decoded.items[0].mods).toEqual(["+600 to Physical Damage", "+100 to maximum Life", "5% increased Attack Speed"]);
    expect(decoded.items[0].quality).toBe(20);
    expect(decoded.items[0].sockets).toBe("R-R-R-R-R-R");
    expect(decoded.items[0].slot).toBe("Weapon 1");
  });

  it("preserves all skill groups with gems", () => {
    const decoded = decodeBuild(encodeBuild(SAMPLE_BUILD));
    expect(decoded.skills).toHaveLength(2);
    expect(decoded.skills[0].label).toBe("Cyclone");
    expect(decoded.skills[0].gems).toHaveLength(4);
    expect(decoded.skills[0].gems[0].name).toBe("Cyclone");
    expect(decoded.skills[0].gems[0].level).toBe(21);
    expect(decoded.skills[0].gems[0].quality).toBe(20);
    expect(decoded.skills[0].gems[1].isSupport).toBe(true);
    expect(decoded.skills[0].gems[1].skillId).toBe("SupportMeleePhysicalDamage");
  });

  it("preserves config options", () => {
    const decoded = decodeBuild(encodeBuild(SAMPLE_BUILD));
    expect(decoded.config).toEqual([
      { key: "enemyIsBoss", value: "true" },
      { key: "usePowerCharges", value: "true" },
    ]);
  });

  it("preserves notes", () => {
    const decoded = decodeBuild(encodeBuild(SAMPLE_BUILD));
    expect(decoded.notes).toBe("Cyclone Slayer league starter. Farm with this, transition to crit at 90+.");
  });

  it("preserves item mod text exactly (no parsing, no lossy conversion)", () => {
    const decoded = decodeBuild(encodeBuild(SAMPLE_BUILD));
    for (let i = 0; i < SAMPLE_BUILD.items.length; i++) {
      expect(decoded.items[i].mods).toEqual(SAMPLE_BUILD.items[i].mods);
    }
  });
});

describe("buildToXml / xmlToBuild (PoB roundtrip)", () => {
  it("converts to valid XML", () => {
    const xml = buildToXml(SAMPLE_BUILD);
    expect(xml).toContain("<?xml");
    expect(xml).toContain("<PathOfBuilding>");
    expect(xml).toContain('className="Duelist"');
    expect(xml).toContain('ascendClassName="Slayer"');
    expect(xml).toContain('level="95"');
    expect(xml).toContain("Starforge");
    expect(xml).toContain("Cyclone");
    expect(xml).toContain("+600 to Physical Damage");
    expect(xml).toContain("Farm with this");
  });

  it("XML -> Build -> XML preserves key data", () => {
    const xml1 = buildToXml(SAMPLE_BUILD);
    const parsed = xmlToBuild(xml1);
    expect(parsed.level).toBe(95);
    expect(parsed.className).toBe("Duelist");
    expect(parsed.ascendancy).toBe("Slayer");
    expect(parsed.items.length).toBeGreaterThanOrEqual(4);
    expect(parsed.skills).toHaveLength(2);
    expect(parsed.notes).toContain("Farm with this");

    const starforge = parsed.items.find(i => i.name === "Starforge");
    expect(starforge).toBeDefined();
    expect(starforge!.mods).toContain("+600 to Physical Damage");
  });
});

describe("full roundtrip: Build -> binary -> Build -> XML -> Build", () => {
  it("preserves everything through the full chain", () => {
    // Build -> binary -> Build
    const binary = encodeBuild(SAMPLE_BUILD);
    const fromBinary = decodeBuild(binary);

    // Build -> XML -> Build
    const xml = buildToXml(fromBinary);
    const fromXml = xmlToBuild(xml);

    // Verify key fields survived the full chain
    expect(fromXml.level).toBe(SAMPLE_BUILD.level);
    expect(fromXml.className).toBe(SAMPLE_BUILD.className);
    expect(fromXml.ascendancy).toBe(SAMPLE_BUILD.ascendancy);
    expect(fromXml.skills).toHaveLength(SAMPLE_BUILD.skills.length);
    expect(fromXml.notes).toBe(SAMPLE_BUILD.notes);

    const origStarforge = SAMPLE_BUILD.items.find(i => i.name === "Starforge")!;
    const rtStarforge = fromXml.items.find(i => i.name === "Starforge");
    expect(rtStarforge).toBeDefined();
    expect(rtStarforge!.mods).toEqual(origStarforge.mods);
  });
});

describe("compressed code roundtrip", () => {
  it("roundtrips through compress + base64url", async () => {
    const { encodeBuildCode, decodeBuildCode } = await import("./codec");
    const code = await encodeBuildCode(SAMPLE_BUILD);
    expect(code.startsWith("tsc1_")).toBe(true);

    const decoded = await decodeBuildCode(code);
    expect(decoded.level).toBe(95);
    expect(decoded.items).toHaveLength(5);
    expect(decoded.skills).toHaveLength(2);
    expect(decoded.items[0].mods).toEqual(SAMPLE_BUILD.items[0].mods);

    console.log(`Full-fidelity TSC code: ${code.length} chars`);
    console.log(`Equivalent XML: ${buildToXml(SAMPLE_BUILD).length} chars`);
  });
});

describe("size measurements", () => {
  it("binary is smaller than JSON and XML", () => {
    const binary = encodeBuild(SAMPLE_BUILD);
    const json = JSON.stringify(SAMPLE_BUILD);
    const xml = buildToXml(SAMPLE_BUILD);

    console.log(`\nFull-fidelity (lossless) sizes:`);
    console.log(`  Binary:  ${binary.length} bytes`);
    console.log(`  JSON:    ${json.length} bytes (${(json.length / binary.length).toFixed(1)}x larger)`);
    console.log(`  XML:     ${xml.length} bytes (${(xml.length / binary.length).toFixed(1)}x larger)`);

    expect(binary.length).toBeLessThan(json.length);
    expect(binary.length).toBeLessThan(xml.length);
  });
});
