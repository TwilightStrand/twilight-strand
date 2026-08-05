import { describe, it, expect } from "vitest";
import { classifyBuildInput, parseAccountCharFromUrl, gggDataToXml } from "../import-export";

describe("classifyBuildInput", () => {
  it("detects TSC codes", () => {
    expect(classifyBuildInput("tsc1_eJyF0MFKw0AQ...")).toBe("tsc-code");
  });

  it("detects PoB codes", () => {
    expect(classifyBuildInput("eNrtVk2P2jAQvfMrUNVeaJfYcZyEY1d0u+2hEmp7rmJnQqwmdrCdLPx7nE0gu1qpSD3gQ+aN5+N5M/Ly")).toBe("pob-code");
  });

  it("detects raw XML", () => {
    expect(classifyBuildInput('<?xml version="1.0"?><PathOfBuilding/>')).toBe("raw-xml");
    expect(classifyBuildInput("<PathOfBuilding><Build/></PathOfBuilding>")).toBe("raw-xml");
  });

  it("detects pastebin URLs", () => {
    expect(classifyBuildInput("https://pastebin.com/ppBqeTCb")).toBe("pastebin-url");
    expect(classifyBuildInput("pastebin.com/raw/abc123")).toBe("pastebin-url");
  });

  it("detects pobb.in URLs", () => {
    expect(classifyBuildInput("https://pobb.in/ifl5B1T4ewHb")).toBe("pobbin-url");
    expect(classifyBuildInput("pobb.in/abc123")).toBe("pobbin-url");
  });

  it("detects PoE profile URLs", () => {
    expect(classifyBuildInput("https://www.pathofexile.com/account/view-profile/PlayerName/characters")).toBe("poe-profile-url");
    expect(classifyBuildInput("https://pathofexile.com/account/view-profile/SomePlayer/characters?character=MyChar")).toBe("poe-profile-url");
  });

  it("detects poe.ninja build URLs", () => {
    expect(classifyBuildInput("https://poe.ninja/builds/char/AccountName/CharacterName")).toBe("poe-ninja-url");
    expect(classifyBuildInput("https://poe.ninja/poe1/builds/char/Player123/MyBuild")).toBe("poe-ninja-url");
  });

  it("returns unknown for unrecognized input", () => {
    expect(classifyBuildInput("hello world")).toBe("unknown");
    expect(classifyBuildInput("short")).toBe("unknown");
    expect(classifyBuildInput("")).toBe("unknown");
  });

  it("handles whitespace", () => {
    expect(classifyBuildInput("  tsc1_abc...  ")).toBe("tsc-code");
    expect(classifyBuildInput("\n<?xml version=\"1.0\"?>")).toBe("raw-xml");
  });
});

describe("parseAccountCharFromUrl", () => {
  it("parses PoE profile URL with character param", () => {
    const result = parseAccountCharFromUrl(
      "https://www.pathofexile.com/account/view-profile/PlayerOne/characters?character=CycloneSlayer",
      "poe-profile-url",
    );
    expect(result.account).toBe("PlayerOne");
    expect(result.character).toBe("CycloneSlayer");
  });

  it("parses PoE profile URL without character", () => {
    const result = parseAccountCharFromUrl(
      "https://www.pathofexile.com/account/view-profile/PlayerTwo/characters",
      "poe-profile-url",
    );
    expect(result.account).toBe("PlayerTwo");
    expect(result.character).toBe("");
  });

  it("parses simple profile URL", () => {
    const result = parseAccountCharFromUrl(
      "https://www.pathofexile.com/account/view-profile/SomeGuy",
      "poe-profile-url",
    );
    expect(result.account).toBe("SomeGuy");
    expect(result.character).toBe("");
  });

  it("parses poe.ninja char URL", () => {
    const result = parseAccountCharFromUrl(
      "https://poe.ninja/builds/char/AccountName/CharacterName",
      "poe-ninja-url",
    );
    expect(result.account).toBe("AccountName");
    expect(result.character).toBe("CharacterName");
  });

  it("parses poe.ninja URL with path prefix", () => {
    const result = parseAccountCharFromUrl(
      "https://poe.ninja/poe1/builds/char/Player123/MyBuild?type=exp",
      "poe-ninja-url",
    );
    expect(result.account).toBe("Player123");
    expect(result.character).toBe("MyBuild");
  });

  it("handles URL-encoded names", () => {
    const result = parseAccountCharFromUrl(
      "https://poe.ninja/builds/char/Some%20Player/My%20Character",
      "poe-ninja-url",
    );
    expect(result.account).toBe("Some Player");
    expect(result.character).toBe("My Character");
  });

  it("returns empty for invalid URLs", () => {
    const result = parseAccountCharFromUrl("https://example.com", "poe-ninja-url");
    expect(result.account).toBe("");
    expect(result.character).toBe("");
  });
});

describe("gggDataToXml", () => {
  const MOCK_ITEMS_DATA: Record<string, unknown> = {
    character: { name: "TestChar", class: "Marauder", level: 90 },
    items: [
      {
        inventoryId: "BodyArmour",
        frameType: 2,
        name: "<<set:MS>><<set:M>><<set:S>>Doom Shell",
        typeLine: "Glorious Plate",
        explicitMods: ["+110 to maximum Life", "+40% to Fire Resistance"],
        implicitMods: [],
        socketedItems: [
          {
            typeLine: "Cyclone",
            support: false,
            properties: [
              { name: "Level", values: [["21", 0]] },
              { name: "Quality", values: [["+20%", 0]] },
            ],
          },
          {
            typeLine: "Melee Physical Damage Support",
            support: true,
            properties: [
              { name: "Level", values: [["20", 0]] },
              { name: "Quality", values: [["+20%", 0]] },
            ],
          },
        ],
      },
      {
        inventoryId: "Weapon",
        frameType: 3,
        name: "<<set:MS>><<set:M>><<set:S>>Starforge",
        typeLine: "Infernal Sword",
        explicitMods: ["+600 to Physical Damage", "+100 to maximum Life"],
        implicitMods: ["30% increased Global Accuracy Rating"],
        socketedItems: [],
      },
      {
        inventoryId: "Flask",
        frameType: 0,
        name: "",
        typeLine: "Diamond Flask",
        explicitMods: [],
        implicitMods: [],
        socketedItems: [],
      },
      {
        inventoryId: "Flask",
        frameType: 0,
        name: "",
        typeLine: "Quicksilver Flask",
        explicitMods: [],
        implicitMods: [],
        socketedItems: [],
      },
    ],
  };

  const MOCK_PASSIVES_DATA = { hashes: [4011, 6741, 14914] };

  it("produces valid PoB XML", () => {
    const xml = gggDataToXml(MOCK_ITEMS_DATA, MOCK_PASSIVES_DATA, "TestChar");
    expect(xml).toContain("<?xml");
    expect(xml).toContain("<PathOfBuilding>");
    expect(xml).toContain('className="Marauder"');
    expect(xml).toContain('level="90"');
  });

  it("includes items with mods", () => {
    const xml = gggDataToXml(MOCK_ITEMS_DATA, MOCK_PASSIVES_DATA, "TestChar");
    expect(xml).toContain("+110 to maximum Life");
    expect(xml).toContain("+40% to Fire Resistance");
    expect(xml).toContain("+600 to Physical Damage");
  });

  it("strips GGG name prefixes", () => {
    const xml = gggDataToXml(MOCK_ITEMS_DATA, MOCK_PASSIVES_DATA, "TestChar");
    expect(xml).toContain("Doom Shell");
    expect(xml).toContain("Starforge");
    expect(xml).not.toContain("<<set:MS>>");
  });

  it("assigns correct item slots", () => {
    const xml = gggDataToXml(MOCK_ITEMS_DATA, MOCK_PASSIVES_DATA, "TestChar");
    expect(xml).toContain('name="Body Armour"');
    expect(xml).toContain('name="Weapon 1"');
    expect(xml).toContain('name="Flask 1"');
    expect(xml).toContain('name="Flask 2"');
  });

  it("extracts socketed gems with levels", () => {
    const xml = gggDataToXml(MOCK_ITEMS_DATA, MOCK_PASSIVES_DATA, "TestChar");
    expect(xml).toContain('nameSpec="Cyclone"');
    expect(xml).toContain('level="21"');
    expect(xml).toContain('nameSpec="Melee Physical Damage Support"');
    expect(xml).toContain('level="20"');
  });

  it("handles unique items (frameType 3)", () => {
    const xml = gggDataToXml(MOCK_ITEMS_DATA, MOCK_PASSIVES_DATA, "TestChar");
    expect(xml).toContain("Rarity: Unique");
    expect(xml).toContain("Starforge");
  });

  it("handles implicit mods", () => {
    const xml = gggDataToXml(MOCK_ITEMS_DATA, MOCK_PASSIVES_DATA, "TestChar");
    expect(xml).toContain("Implicits: 1");
    expect(xml).toContain("30% increased Global Accuracy Rating");
  });

  it("includes character name in notes", () => {
    const xml = gggDataToXml(MOCK_ITEMS_DATA, MOCK_PASSIVES_DATA, "TestChar");
    expect(xml).toContain("Imported from TestChar");
  });

  it("handles empty items gracefully", () => {
    const xml = gggDataToXml({ character: { class: "Witch", level: 1 }, items: [] }, { hashes: [] }, "Empty");
    expect(xml).toContain('className="Witch"');
    expect(xml).toContain("<Items>");
    expect(xml).toContain("</PathOfBuilding>");
  });
});
