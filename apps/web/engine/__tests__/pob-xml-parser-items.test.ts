import { describe, it, expect } from "vitest";
import { parsePobXml } from "../pob-xml-parser";

const wrap = (inner: string) => `<?xml version="1.0"?>
<PathOfBuilding>
  <Build level="90" className="Witch" ascendClassName="Occultist" mainSocketGroup="1" targetVersion="3_0"/>
  <Tree activeSpec="1"><Spec treeVersion="3_29"><URL></URL></Spec></Tree>
  ${inner}
</PathOfBuilding>`;

describe("pob-xml-parser: items", () => {
  it("parses a rare item with explicit mods", () => {
    const xml = wrap(`<Items>
      <Item id="1">Rarity: Rare
Hypnotic Crown
Hubris Circlet
--------
Energy Shield: 245
--------
+80 to maximum Energy Shield
+40 to Intelligence
+30% to Cold Resistance</Item>
      <Slot name="Helmet" itemId="1"/>
    </Items><Skills/>`);

    const result = parsePobXml(xml);
    expect(result.items).toHaveLength(1);

    const item = result.items[0];
    expect(item.rarity).toBe("Rare");
    expect(item.name).toBe("Hypnotic Crown");
    expect(item.slot).toBe("Helmet");
    expect(item.baseES).toBe(245);
    expect(item.mods).toContain("+80 to maximum Energy Shield");
    expect(item.mods).toContain("+40 to Intelligence");
    expect(item.mods).toContain("+30% to Cold Resistance");
  });

  it("parses base defence stats from item header", () => {
    const xml = wrap(`<Items>
      <Item id="1">Rarity: Rare
Test Plate
Glorious Plate
--------
Armour: 1500
--------
+100 to maximum Life</Item>
      <Slot name="Body Armour" itemId="1"/>
    </Items><Skills/>`);

    const item = parsePobXml(xml).items[0];
    expect(item.baseArmour).toBe(1500);
    expect(item.baseEvasion).toBeUndefined();
    expect(item.baseES).toBeUndefined();
  });

  it("parses evasion and energy shield hybrid gear", () => {
    const xml = wrap(`<Items>
      <Item id="1">Rarity: Rare
Hybrid Chest
Sadist Garb
--------
Evasion Rating: 800
Energy Shield: 200
--------
+50 to Dexterity</Item>
      <Slot name="Body Armour" itemId="1"/>
    </Items><Skills/>`);

    const item = parsePobXml(xml).items[0];
    expect(item.baseEvasion).toBe(800);
    expect(item.baseES).toBe(200);
  });

  it("parses shield block chance", () => {
    const xml = wrap(`<Items>
      <Item id="1">Rarity: Rare
Test Shield
Titanium Spirit Shield
--------
Chance to Block: 25
Energy Shield: 180
--------
+30 to maximum Life</Item>
      <Slot name="Weapon 2" itemId="1"/>
    </Items><Skills/>`);

    const item = parsePobXml(xml).items[0];
    expect(item.baseBlock).toBe(25);
    expect(item.baseES).toBe(180);
  });

  it("parses a unique item", () => {
    const xml = wrap(`<Items>
      <Item id="1">Rarity: Unique
Shavronne's Wrappings
Occultist's Vestment
--------
Energy Shield: 350
--------
Chaos Damage does not bypass Energy Shield</Item>
      <Slot name="Body Armour" itemId="1"/>
    </Items><Skills/>`);

    const item = parsePobXml(xml).items[0];
    expect(item.rarity).toBe("Unique");
    expect(item.name).toBe("Shavronne's Wrappings");
    expect(item.mods).toContain("Chaos Damage does not bypass Energy Shield");
  });

  it("handles multiple items with separate slots", () => {
    const xml = wrap(`<Items>
      <Item id="1">Rarity: Rare
Ring A
Coral Ring
--------
+30 to maximum Life</Item>
      <Item id="2">Rarity: Rare
Ring B
Diamond Ring
--------
+20% to Fire Resistance</Item>
      <Slot name="Ring 1" itemId="1"/>
      <Slot name="Ring 2" itemId="2"/>
    </Items><Skills/>`);

    const result = parsePobXml(xml);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].slot).toBe("Ring 1");
    expect(result.items[1].slot).toBe("Ring 2");
  });

  it("returns empty slot when item has no matching Slot element", () => {
    const xml = wrap(`<Items>
      <Item id="1">Rarity: Normal
Scroll of Wisdom
Scroll of Wisdom
--------
Something</Item>
    </Items><Skills/>`);

    const item = parsePobXml(xml).items[0];
    expect(item.slot).toBe("");
  });

  it("returns empty items array when Items is empty", () => {
    const xml = wrap(`<Items/><Skills/>`);
    expect(parsePobXml(xml).items).toEqual([]);
  });
});

describe("pob-xml-parser: tree jewel sockets", () => {
  it("includes jewels from Socket elements when active ItemSet is used", () => {
    const xml = `<?xml version="1.0"?>
<PathOfBuilding>
  <Build level="90" className="Witch" ascendClassName="Occultist" mainSocketGroup="1" targetVersion="3_0"/>
  <Tree activeSpec="1">
    <Spec treeVersion="3_29">
      <URL></URL>
      <Socket nodeId="26725" itemId="2"/>
      <Socket nodeId="36634" itemId="3"/>
    </Spec>
  </Tree>
  <Items activeItemSet="1">
    <Item id="1">Rarity: Rare
Hypnotic Crown
Hubris Circlet
--------
Energy Shield: 245
--------
+80 to maximum Energy Shield</Item>
    <Item id="2">Rarity: Unique
Watcher's Eye
Prismatic Jewel
--------
Implicits: 0
+50 to maximum Energy Shield
6% increased maximum Energy Shield while affected by Discipline</Item>
    <Item id="3">Rarity: Rare
Armageddon Splinter
Cobalt Jewel
--------
Implicits: 0
+12 to maximum Energy Shield
+10% to Fire Resistance</Item>
    <ItemSet id="1">
      <Slot name="Helmet" itemId="1"/>
    </ItemSet>
  </Items>
  <Skills/>
</PathOfBuilding>`;

    const result = parsePobXml(xml);
    expect(result.items).toHaveLength(3);

    const helmet = result.items.find(i => i.slot === "Helmet");
    expect(helmet).toBeDefined();
    expect(helmet!.name).toBe("Hypnotic Crown");

    const jewel1 = result.items.find(i => i.slot === "TreeJewel 1");
    expect(jewel1).toBeDefined();
    expect(jewel1!.name).toBe("Watcher's Eye");
    expect(jewel1!.mods).toContain("+50 to maximum Energy Shield");

    const jewel2 = result.items.find(i => i.slot === "TreeJewel 2");
    expect(jewel2).toBeDefined();
    expect(jewel2!.name).toBe("Armageddon Splinter");
    expect(jewel2!.mods).toContain("+10% to Fire Resistance");
  });

  it("assigns TreeJewel slot names without active ItemSet", () => {
    const xml = `<?xml version="1.0"?>
<PathOfBuilding>
  <Build level="90" className="Witch" ascendClassName="Occultist" mainSocketGroup="1" targetVersion="3_0"/>
  <Tree activeSpec="1">
    <Spec treeVersion="3_29">
      <URL></URL>
      <Socket nodeId="26725" itemId="1"/>
    </Spec>
  </Tree>
  <Items>
    <Item id="1">Rarity: Unique
Watcher's Eye
Prismatic Jewel
--------
Implicits: 0
+50 to maximum Energy Shield</Item>
  </Items>
  <Skills/>
</PathOfBuilding>`;

    const result = parsePobXml(xml);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].slot).toBe("TreeJewel 1");
    expect(result.items[0].name).toBe("Watcher's Eye");
  });

  it("skips Socket elements with itemId 0", () => {
    const xml = `<?xml version="1.0"?>
<PathOfBuilding>
  <Build level="90" className="Witch" ascendClassName="Occultist" mainSocketGroup="1" targetVersion="3_0"/>
  <Tree activeSpec="1">
    <Spec treeVersion="3_29">
      <URL></URL>
      <Socket nodeId="26725" itemId="0"/>
      <Socket nodeId="36634" itemId="1"/>
    </Spec>
  </Tree>
  <Items activeItemSet="1">
    <Item id="1">Rarity: Rare
Test Jewel
Cobalt Jewel
--------
Implicits: 0
+10% to Fire Resistance</Item>
    <ItemSet id="1"/>
  </Items>
  <Skills/>
</PathOfBuilding>`;

    const result = parsePobXml(xml);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].slot).toBe("TreeJewel 1");
  });
});

describe("pob-xml-parser: config", () => {
  it("extracts boolean config values", () => {
    const xml = wrap(`<Items/><Skills/>
      <Config>
        <Input name="conditionUsePowerCharges" boolean="true"/>
        <Input name="conditionLowLife" boolean="false"/>
      </Config>`);

    const config = parsePobXml(xml).config;
    expect(config.conditionUsePowerCharges).toBe(true);
    expect(config.conditionLowLife).toBe(false);
  });

  it("extracts number config values", () => {
    const xml = wrap(`<Items/><Skills/>
      <Config>
        <Input name="enemyLevel" number="83"/>
        <Input name="enemyChaosRes" number="-60"/>
      </Config>`);

    const config = parsePobXml(xml).config;
    expect(config.enemyLevel).toBe(83);
    expect(config.enemyChaosRes).toBe(-60);
  });

  it("extracts string config values", () => {
    const xml = wrap(`<Items/><Skills/>
      <Config>
        <Input name="enemyType" string="Boss"/>
      </Config>`);

    const config = parsePobXml(xml).config;
    expect(config.enemyType).toBe("Boss");
  });

  it("returns empty config when Config element missing", () => {
    const xml = wrap(`<Items/><Skills/>`);
    expect(parsePobXml(xml).config).toEqual({});
  });
});

describe("pob-xml-parser: skills", () => {
  it("detects support gems by skillId containing Support", () => {
    const xml = wrap(`<Items/><Skills>
      <Skill enabled="true" slot="Body Armour">
        <Gem level="20" quality="20" skillId="ArcticArmour" nameSpec="Arctic Armour" enabled="true"/>
        <Gem level="20" quality="20" skillId="SupportIncreasedDuration" nameSpec="Increased Duration Support" enabled="true"/>
      </Skill>
    </Skills>`);

    const skills = parsePobXml(xml).skills;
    expect(skills[0].gems[0].isSupport).toBe(false);
    expect(skills[0].gems[1].isSupport).toBe(true);
  });

  it("uses first non-support gem name as label when no label attribute", () => {
    const xml = wrap(`<Items/><Skills>
      <Skill enabled="true" slot="Helmet">
        <Gem level="20" quality="0" skillId="SupportBurning" nameSpec="Burning Damage Support" enabled="true"/>
        <Gem level="21" quality="23" skillId="RighteousFire" nameSpec="Righteous Fire" enabled="true"/>
      </Skill>
    </Skills>`);

    const skills = parsePobXml(xml).skills;
    expect(skills[0].label).toBe("Righteous Fire");
  });

  it("handles disabled skills", () => {
    const xml = wrap(`<Items/><Skills>
      <Skill enabled="false" slot="Weapon 1">
        <Gem level="20" quality="0" skillId="VaalHaste" nameSpec="Vaal Haste" enabled="true"/>
      </Skill>
    </Skills>`);

    const skills = parsePobXml(xml).skills;
    expect(skills[0].enabled).toBe(false);
  });

  it("skips skill groups with no gems", () => {
    const xml = wrap(`<Items/><Skills>
      <Skill enabled="true" slot="Body Armour"/>
      <Skill enabled="true" slot="Helmet">
        <Gem level="20" quality="0" skillId="Grace" nameSpec="Grace" enabled="true"/>
      </Skill>
    </Skills>`);

    const skills = parsePobXml(xml).skills;
    expect(skills).toHaveLength(1);
    expect(skills[0].label).toBe("Grace");
  });

  it("defaults gem level to 20 when not specified", () => {
    const xml = wrap(`<Items/><Skills>
      <Skill enabled="true" slot="Helmet">
        <Gem skillId="Grace" nameSpec="Grace" enabled="true"/>
      </Skill>
    </Skills>`);

    const skills = parsePobXml(xml).skills;
    expect(skills[0].gems[0].level).toBe(20);
  });
});

describe("pob-xml-parser: build info edge cases", () => {
  it("defaults class to Scion when className missing", () => {
    const xml = `<?xml version="1.0"?><PathOfBuilding><Build level="1" targetVersion="3_0"/><Tree activeSpec="1"><Spec treeVersion="3_29"><URL></URL></Spec></Tree><Items/><Skills/></PathOfBuilding>`;
    const result = parsePobXml(xml);
    expect(result.stats.class_name).toBe("Scion");
  });

  it("calculates base life from level", () => {
    const xml = wrap(`<Items/><Skills/>`).replace('level="90"', 'level="1"');
    const result = parsePobXml(xml);
    expect(result.stats.life).toBe(60);
    expect(result.stats.mana).toBe(40);
  });

  it("initializes resistances to -60 (act 10 penalty)", () => {
    const result = parsePobXml(wrap(`<Items/><Skills/>`));
    expect(result.stats.fire_res).toBe(-60);
    expect(result.stats.cold_res).toBe(-60);
    expect(result.stats.lightning_res).toBe(-60);
    expect(result.stats.chaos_res).toBe(-60);
  });
});
