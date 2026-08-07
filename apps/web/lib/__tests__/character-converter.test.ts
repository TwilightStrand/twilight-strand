import { describe, it, expect } from "vitest";
import { convertCharacterToXml } from "../character-converter";

describe("convertCharacterToXml", () => {
  const minChar = { name: "TestChar", class: "Witch", level: 90, league: "Standard" };
  const emptyItems = { items: [] };
  const emptyPassives = { hashes: [] };

  it("produces valid XML structure", () => {
    const xml = convertCharacterToXml(minChar, emptyItems, emptyPassives);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<PathOfBuilding>");
    expect(xml).toContain("</PathOfBuilding>");
    expect(xml).toContain("<Items>");
    expect(xml).toContain("</Items>");
    expect(xml).toContain("<Skills");
  });

  it("sets class and ascendancy correctly for base class", () => {
    const xml = convertCharacterToXml(minChar, emptyItems, emptyPassives);
    expect(xml).toContain('className="Witch"');
    expect(xml).toContain('ascendClassName="None"');
  });

  it("maps ascendancy to base class", () => {
    const char = { ...minChar, class: "Occultist" };
    const xml = convertCharacterToXml(char, emptyItems, emptyPassives);
    expect(xml).toContain('className="Witch"');
    expect(xml).toContain('ascendClassName="Occultist"');
  });

  it("maps all seven base classes", () => {
    const bases = ["Marauder", "Witch", "Ranger", "Duelist", "Templar", "Shadow", "Scion"];
    for (const cls of bases) {
      const xml = convertCharacterToXml({ ...minChar, class: cls }, emptyItems, emptyPassives);
      expect(xml).toContain(`className="${cls}"`);
      expect(xml).toContain('ascendClassName="None"');
    }
  });

  it("maps ascendancies to their base class", () => {
    const pairs: [string, string][] = [
      ["Juggernaut", "Marauder"],
      ["Necromancer", "Witch"],
      ["Deadeye", "Ranger"],
      ["Gladiator", "Duelist"],
      ["Inquisitor", "Templar"],
      ["Assassin", "Shadow"],
      ["Ascendant", "Scion"],
    ];

    for (const [asc, base] of pairs) {
      const xml = convertCharacterToXml({ ...minChar, class: asc }, emptyItems, emptyPassives);
      expect(xml).toContain(`className="${base}"`);
      expect(xml).toContain(`ascendClassName="${asc}"`);
    }
  });

  it("includes passive tree node hashes", () => {
    const passives = { hashes: [100, 200, 300] };
    const xml = convertCharacterToXml(minChar, emptyItems, passives);
    expect(xml).toContain('nodes="100,200,300"');
  });

  it("includes level in build tag", () => {
    const xml = convertCharacterToXml(minChar, emptyItems, emptyPassives);
    expect(xml).toContain('level="90"');
  });

  it("converts equipped items to XML", () => {
    const items = {
      items: [
        {
          typeLine: "Vaal Regalia",
          frameType: 2,
          inventoryId: "BodyArmour",
          explicitMods: ["+120 to maximum Energy Shield", "+40 to Intelligence"],
        },
      ],
    };

    const xml = convertCharacterToXml(minChar, items, emptyPassives);
    expect(xml).toContain("Rarity: Rare");
    expect(xml).toContain("Vaal Regalia");
    expect(xml).toContain("+120 to maximum Energy Shield");
    expect(xml).toContain('name="Body Armour"');
  });

  it("handles unique items (frameType 3)", () => {
    const items = {
      items: [
        {
          name: "Shavronne's Wrappings",
          typeLine: "Occultist's Vestment",
          frameType: 3,
          inventoryId: "BodyArmour",
          explicitMods: ["Chaos Damage does not bypass Energy Shield"],
        },
      ],
    };

    const xml = convertCharacterToXml(minChar, items, emptyPassives);
    expect(xml).toContain("Rarity: Unique");
    expect(xml).toContain("Shavronne&apos;s Wrappings");
  });

  it("handles implicit mods", () => {
    const items = {
      items: [
        {
          typeLine: "Two-Stone Ring",
          frameType: 2,
          inventoryId: "Ring",
          implicitMods: ["+16% to Fire and Cold Resistances"],
          explicitMods: ["+30 to maximum Life"],
        },
      ],
    };

    const xml = convertCharacterToXml(minChar, items, emptyPassives);
    expect(xml).toContain("Implicits: 1");
    expect(xml).toContain("{implicit}+16% to Fire and Cold Resistances");
  });

  it("handles crafted mods", () => {
    const items = {
      items: [
        {
          typeLine: "Hubris Circlet",
          frameType: 2,
          inventoryId: "Helm",
          craftedMods: ["+30% to Cold Resistance"],
        },
      ],
    };

    const xml = convertCharacterToXml(minChar, items, emptyPassives);
    expect(xml).toContain("{crafted}+30% to Cold Resistance");
  });

  it("maps inventory slots correctly", () => {
    const slotTests: [string, string][] = [
      ["Weapon", "Weapon 1"],
      ["Offhand", "Weapon 2"],
      ["Helm", "Helmet"],
      ["Ring", "Ring 1"],
      ["Ring2", "Ring 2"],
      ["Belt", "Belt"],
    ];

    for (const [inv, expected] of slotTests) {
      const items = {
        items: [{ typeLine: "Test Item", frameType: 0, inventoryId: inv }],
      };
      const xml = convertCharacterToXml(minChar, items, emptyPassives);
      expect(xml).toContain(`name="${expected}"`);
    }
  });

  it("generates skill gems from socketed items", () => {
    const items = {
      items: [
        {
          typeLine: "Vaal Regalia",
          frameType: 2,
          inventoryId: "BodyArmour",
          socketedItems: [
            {
              typeLine: "Vaal Discipline",
              frameType: 4,
              inventoryId: "",
              properties: [
                { name: "Level", values: [["21", 0]] },
                { name: "Quality", values: [["+23%", 0]] },
              ],
            },
          ],
        },
      ],
    };

    const xml = convertCharacterToXml(minChar, items, emptyPassives);
    expect(xml).toContain('level="21"');
    expect(xml).toContain('quality="23"');
    expect(xml).toContain('nameSpec="Vaal Discipline"');
  });

  it("escapes XML special characters", () => {
    const items = {
      items: [
        {
          name: 'Test "Item" <Special>',
          typeLine: "Base & Type",
          frameType: 2,
          inventoryId: "Helm",
          explicitMods: ["mod with <brackets>"],
        },
      ],
    };

    const xml = convertCharacterToXml(minChar, items, emptyPassives);
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&lt;");
    expect(xml).toContain("&gt;");
    expect(xml).toContain("&quot;");
    expect(xml).not.toContain("<<");
  });

  it("handles empty socketed items gracefully", () => {
    const items = {
      items: [
        {
          typeLine: "Vaal Regalia",
          frameType: 2,
          inventoryId: "BodyArmour",
          socketedItems: [],
        },
      ],
    };

    const xml = convertCharacterToXml(minChar, items, emptyPassives);
    expect(xml).not.toContain("<Gem ");
  });

  it("defaults gem level to 20 when property missing", () => {
    const items = {
      items: [
        {
          typeLine: "Helmet",
          frameType: 2,
          inventoryId: "Helm",
          socketedItems: [
            {
              typeLine: "Determination",
              frameType: 4,
              inventoryId: "",
              properties: [],
            },
          ],
        },
      ],
    };

    const xml = convertCharacterToXml(minChar, items, emptyPassives);
    expect(xml).toContain('level="20"');
    expect(xml).toContain('quality="0"');
  });
});
