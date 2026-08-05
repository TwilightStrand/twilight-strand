export interface TestBuild {
  name: string;
  xml: string;
  expectedClass: string;
  expectedAscendancy: string;
  expectedLevel: number;
  minLife: number;
  minDps: number;
  minItemMods: number;
  minSupportGems: number;
  hasWeapon: boolean;
  hasFlasks: boolean;
}

export const TEST_BUILDS: TestBuild[] = [
  {
    name: "Cyclone Slayer",
    expectedClass: "Duelist",
    expectedAscendancy: "Slayer",
    expectedLevel: 95,
    minLife: 0,
    minDps: 0,
    minItemMods: 20,
    minSupportGems: 3,
    hasWeapon: true,
    hasFlasks: true,
    xml: `<?xml version="1.0"?>
<PathOfBuilding>
  <Build level="95" className="Duelist" ascendClassName="Slayer" mainSocketGroup="1" targetVersion="3_0"/>
  <Skills>
    <Skill mainActiveSkill="1" enabled="true" slot="Body Armour">
      <Gem level="21" quality="20" skillId="Cyclone" nameSpec="Cyclone" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportMeleePhysicalDamage" nameSpec="Melee Physical Damage Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportBrutality" nameSpec="Brutality Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportFasterAttacks" nameSpec="Faster Attacks Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportIncreasedCriticalStrikes" nameSpec="Increased Critical Strikes Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportConcentratedEffect" nameSpec="Concentrated Effect Support" enabled="true"/>
    </Skill>
    <Skill enabled="true" slot="Helmet">
      <Gem level="20" quality="0" skillId="HeraldOfAsh" nameSpec="Herald of Ash" enabled="true"/>
    </Skill>
  </Skills>
  <Tree activeSpec="1">
    <Spec treeVersion="3_29"><URL></URL></Spec>
  </Tree>
  <Items>
    <Item id="1">
Rarity: Unique
Starforge
Infernal Sword
--------
+600 to Physical Damage
+100 to maximum Life
5% increased Attack Speed
--------
</Item>
    <Item id="2">
Rarity: Rare
Apocalypse Crown
Lion Pelt
--------
+89 to maximum Life
+42% to Fire Resistance
+36% to Cold Resistance
+30% to Lightning Resistance
15% increased Armour
--------
</Item>
    <Item id="3">
Rarity: Rare
Doom Shell
Glorious Plate
--------
+110 to maximum Life
+40% to Fire Resistance
+38% to Cold Resistance
12% increased Armour and Evasion
+42 to Strength
--------
</Item>
    <Item id="4">
Rarity: Rare
Eagle Grasp
Spiked Gloves
--------
+70 to maximum Life
+30% to Lightning Resistance
+200 to Accuracy Rating
15% increased Melee Damage
--------
</Item>
    <Item id="5">
Rarity: Rare
Rage March
Titan Greaves
--------
+80 to maximum Life
+30% to Fire Resistance
+25% to Cold Resistance
10% increased Movement Speed
+40 to Strength
--------
</Item>
    <Item id="6">
Rarity: Rare
Woe Gorget
Onyx Amulet
--------
+50 to maximum Life
+25% to Critical Strike Multiplier
+35% to Fire Resistance
10% increased Damage
--------
</Item>
    <Item id="7">
Rarity: Rare
Storm Coil
Steel Ring
--------
+60 to maximum Life
+30% to Cold Resistance
Adds 5 to 12 Physical Damage
+200 to Accuracy Rating
--------
</Item>
    <Item id="8">
Rarity: Rare
Glyph Band
Diamond Ring
--------
+55 to maximum Life
+35% to Lightning Resistance
+25% to Critical Strike Multiplier
0.4% of Attack Damage Leeched as Life
--------
</Item>
    <Item id="9">
Rarity: Rare
Stygian Vise
--------
+90 to maximum Life
+40% to Fire Resistance
+35% to Cold Resistance
+30 to Strength
--------
</Item>
    <Item id="10">
Rarity: Normal
Diamond Flask
--------
</Item>
    <Item id="11">
Rarity: Unique
Lion's Roar
Granite Flask
--------
</Item>
    <Item id="12">
Rarity: Normal
Quicksilver Flask
--------
</Item>
    <Slot name="Weapon 1" itemId="1"/>
    <Slot name="Helmet" itemId="2"/>
    <Slot name="Body Armour" itemId="3"/>
    <Slot name="Gloves" itemId="4"/>
    <Slot name="Boots" itemId="5"/>
    <Slot name="Amulet" itemId="6"/>
    <Slot name="Ring 1" itemId="7"/>
    <Slot name="Ring 2" itemId="8"/>
    <Slot name="Belt" itemId="9"/>
    <Slot name="Flask 1" itemId="10"/>
    <Slot name="Flask 2" itemId="11"/>
    <Slot name="Flask 3" itemId="12"/>
  </Items>
</PathOfBuilding>`,
  },
  {
    name: "RF Juggernaut",
    expectedClass: "Marauder",
    expectedAscendancy: "Juggernaut",
    expectedLevel: 92,
    minLife: 0,
    minDps: 0,
    minItemMods: 15,
    minSupportGems: 2,
    hasWeapon: false,
    hasFlasks: true,
    xml: `<?xml version="1.0"?>
<PathOfBuilding>
  <Build level="92" className="Marauder" ascendClassName="Juggernaut" mainSocketGroup="1" targetVersion="3_0"/>
  <Skills>
    <Skill mainActiveSkill="1" enabled="true" slot="Body Armour">
      <Gem level="21" quality="20" skillId="RighteousFire" nameSpec="Righteous Fire" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportBurningDamage" nameSpec="Burning Damage Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportEfficacy" nameSpec="Efficacy Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportElementalFocus" nameSpec="Elemental Focus Support" enabled="true"/>
    </Skill>
  </Skills>
  <Tree activeSpec="1">
    <Spec treeVersion="3_29"><URL></URL></Spec>
  </Tree>
  <Items>
    <Item id="1">
Rarity: Unique
Kaom's Heart
Glorious Plate
--------
+500 to maximum Life
--------
</Item>
    <Item id="2">
Rarity: Rare
Mind Crest
Bone Helmet
--------
+100 to maximum Life
+45% to Fire Resistance
+40% to Cold Resistance
+35% to Lightning Resistance
Regenerate 1.5% of Life per second
--------
</Item>
    <Item id="3">
Rarity: Rare
Brood Fingers
Titan Gauntlets
--------
+80 to maximum Life
+30% to Fire Resistance
+30% to Cold Resistance
+30 to Strength
--------
</Item>
    <Item id="4">
Rarity: Rare
Doom Road
Titan Greaves
--------
+90 to maximum Life
+35% to Fire Resistance
+30% to Lightning Resistance
10% increased Movement Speed
--------
</Item>
    <Item id="5">
Rarity: Rare
Rise of the Phoenix
Mosaic Kite Shield
--------
+1% to all maximum Elemental Resistances
+40% to Fire Resistance
+60 to maximum Life
--------
</Item>
    <Item id="6">
Rarity: Rare
Stygian Vise
--------
+100 to maximum Life
+40% to Fire Resistance
+35% to Cold Resistance
+30 to Strength
--------
</Item>
    <Item id="7">
Rarity: Normal
Granite Flask
--------
</Item>
    <Item id="8">
Rarity: Normal
Basalt Flask
--------
</Item>
    <Slot name="Body Armour" itemId="1"/>
    <Slot name="Helmet" itemId="2"/>
    <Slot name="Gloves" itemId="3"/>
    <Slot name="Boots" itemId="4"/>
    <Slot name="Weapon 2" itemId="5"/>
    <Slot name="Belt" itemId="6"/>
    <Slot name="Flask 1" itemId="7"/>
    <Slot name="Flask 2" itemId="8"/>
  </Items>
</PathOfBuilding>`,
  },
  {
    name: "CI Vortex Occultist",
    expectedClass: "Witch",
    expectedAscendancy: "Occultist",
    expectedLevel: 94,
    minLife: 0,
    minDps: 0,
    minItemMods: 15,
    minSupportGems: 3,
    hasWeapon: false,
    hasFlasks: false,
    xml: `<?xml version="1.0"?>
<PathOfBuilding>
  <Build level="94" className="Witch" ascendClassName="Occultist" mainSocketGroup="1" targetVersion="3_0"/>
  <Skills>
    <Skill mainActiveSkill="1" enabled="true" slot="Body Armour">
      <Gem level="21" quality="20" skillId="Vortex" nameSpec="Vortex" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportControlledDestruction" nameSpec="Controlled Destruction Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportEfficacy" nameSpec="Efficacy Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportSwiftAffliction" nameSpec="Swift Affliction Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportElementalFocus" nameSpec="Elemental Focus Support" enabled="true"/>
    </Skill>
  </Skills>
  <Tree activeSpec="1">
    <Spec treeVersion="3_29"><URL></URL></Spec>
  </Tree>
  <Items>
    <Item id="1">
Rarity: Rare
Vaal Regalia
--------
+350 to maximum Energy Shield
+45% to Fire Resistance
+40% to Cold Resistance
+38% to Lightning Resistance
--------
</Item>
    <Item id="2">
Rarity: Rare
Hubris Circlet
--------
+200 to maximum Energy Shield
+40% to Fire Resistance
+35% to Cold Resistance
+30 to Intelligence
--------
</Item>
    <Item id="3">
Rarity: Rare
Sorcerer Gloves
--------
+120 to maximum Energy Shield
+30% to Lightning Resistance
+30 to Intelligence
--------
</Item>
    <Item id="4">
Rarity: Rare
Sorcerer Boots
--------
+150 to maximum Energy Shield
+35% to Fire Resistance
+30% to Cold Resistance
10% increased Movement Speed
--------
</Item>
    <Item id="5">
Rarity: Rare
Crystal Belt
--------
+100 to maximum Energy Shield
+40% to Fire Resistance
+35% to Lightning Resistance
+30 to Intelligence
--------
</Item>
    <Slot name="Body Armour" itemId="1"/>
    <Slot name="Helmet" itemId="2"/>
    <Slot name="Gloves" itemId="3"/>
    <Slot name="Boots" itemId="4"/>
    <Slot name="Belt" itemId="5"/>
  </Items>
</PathOfBuilding>`,
  },
  {
    name: "Lightning Arrow Deadeye",
    expectedClass: "Ranger",
    expectedAscendancy: "Deadeye",
    expectedLevel: 93,
    minLife: 0,
    minDps: 0,
    minItemMods: 20,
    minSupportGems: 4,
    hasWeapon: true,
    hasFlasks: true,
    xml: `<?xml version="1.0"?>
<PathOfBuilding>
  <Build level="93" className="Ranger" ascendClassName="Deadeye" mainSocketGroup="1" targetVersion="3_0"/>
  <Skills>
    <Skill mainActiveSkill="1" enabled="true" slot="Body Armour">
      <Gem level="21" quality="20" skillId="LightningArrow" nameSpec="Lightning Arrow" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportElementalDamageWithAttacks" nameSpec="Elemental Damage with Attacks Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportAddedColdDamage" nameSpec="Added Cold Damage Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportLightningPenetration" nameSpec="Lightning Penetration Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportFasterAttacks" nameSpec="Faster Attacks Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportIncreasedCriticalDamage" nameSpec="Increased Critical Damage Support" enabled="true"/>
    </Skill>
  </Skills>
  <Tree activeSpec="1">
    <Spec treeVersion="3_29"><URL></URL></Spec>
  </Tree>
  <Items>
    <Item id="1">
Rarity: Unique
Windripper
Imperial Bow
--------
Adds 50 to 80 Cold Damage
Adds 10 to 200 Lightning Damage
10% increased Attack Speed
40% increased Critical Strike Chance
--------
</Item>
    <Item id="2">
Rarity: Rare
Evasion Jacket
--------
+90 to maximum Life
+1500 to Evasion Rating
+40% to Fire Resistance
+35% to Cold Resistance
--------
</Item>
    <Item id="3">
Rarity: Rare
Lion Pelt
--------
+80 to maximum Life
+35% to Lightning Resistance
+40% to Cold Resistance
+400 to Accuracy Rating
--------
</Item>
    <Item id="4">
Rarity: Rare
Amulet
--------
+50 to maximum Life
+25% to Critical Strike Multiplier
+30% to Lightning Resistance
10% increased Projectile Damage
--------
</Item>
    <Item id="5">
Rarity: Rare
Diamond Ring
--------
+50 to maximum Life
+30% to Fire Resistance
Adds 3 to 50 Lightning Damage
+25% to Critical Strike Multiplier
--------
</Item>
    <Item id="6">
Rarity: Rare
Two-Stone Ring
--------
+55 to maximum Life
+40% to Cold Resistance
+30% to Lightning Resistance
+200 to Accuracy Rating
--------
</Item>
    <Item id="7">
Rarity: Rare
Stygian Vise
--------
+80 to maximum Life
+35% to Fire Resistance
+30% to Cold Resistance
+40 to Dexterity
--------
</Item>
    <Item id="8">
Rarity: Rare
Dragonscale Boots
--------
+70 to maximum Life
+30% to Fire Resistance
10% increased Movement Speed
+400 to Evasion Rating
--------
</Item>
    <Item id="9">
Rarity: Rare
Dragonscale Gauntlets
--------
+60 to maximum Life
+35% to Lightning Resistance
+300 to Accuracy Rating
10% increased Attack Speed
--------
</Item>
    <Item id="10">
Rarity: Normal
Diamond Flask
--------
</Item>
    <Item id="11">
Rarity: Normal
Jade Flask
--------
</Item>
    <Slot name="Weapon 1" itemId="1"/>
    <Slot name="Body Armour" itemId="2"/>
    <Slot name="Helmet" itemId="3"/>
    <Slot name="Amulet" itemId="4"/>
    <Slot name="Ring 1" itemId="5"/>
    <Slot name="Ring 2" itemId="6"/>
    <Slot name="Belt" itemId="7"/>
    <Slot name="Boots" itemId="8"/>
    <Slot name="Gloves" itemId="9"/>
    <Slot name="Flask 1" itemId="10"/>
    <Slot name="Flask 2" itemId="11"/>
  </Items>
</PathOfBuilding>`,
  },
  {
    name: "Poison BV Assassin",
    expectedClass: "Shadow",
    expectedAscendancy: "Assassin",
    expectedLevel: 92,
    minLife: 0,
    minDps: 0,
    minItemMods: 15,
    minSupportGems: 3,
    hasWeapon: false,
    hasFlasks: false,
    xml: `<?xml version="1.0"?>
<PathOfBuilding>
  <Build level="92" className="Shadow" ascendClassName="Assassin" mainSocketGroup="1" targetVersion="3_0"/>
  <Skills>
    <Skill mainActiveSkill="1" enabled="true" slot="Body Armour">
      <Gem level="21" quality="20" skillId="BladeVortex" nameSpec="Blade Vortex" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportDeadlyAilments" nameSpec="Deadly Ailments Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportVoidManipulation" nameSpec="Void Manipulation Support" enabled="true"/>
      <Gem level="20" quality="20" skillId="SupportUnboundAilments" nameSpec="Unbound Ailments Support" enabled="true"/>
    </Skill>
  </Skills>
  <Tree activeSpec="1">
    <Spec treeVersion="3_29"><URL></URL></Spec>
  </Tree>
  <Items>
    <Item id="1">
Rarity: Rare
Assassin's Garb
--------
+90 to maximum Life
+1000 to Evasion Rating
+40% to Fire Resistance
+35% to Cold Resistance
+30% to Lightning Resistance
--------
</Item>
    <Item id="2">
Rarity: Rare
Lion Pelt
--------
+80 to maximum Life
+40% to Cold Resistance
+35% to Lightning Resistance
+30 to Dexterity
--------
</Item>
    <Item id="3">
Rarity: Rare
Stygian Vise
--------
+85 to maximum Life
+40% to Fire Resistance
+30% to Cold Resistance
+35 to Dexterity
--------
</Item>
    <Item id="4">
Rarity: Rare
Amulet
--------
+50 to maximum Life
+20% to Chaos Resistance
+30% to Cold Resistance
10% increased Chaos Damage
--------
</Item>
    <Slot name="Body Armour" itemId="1"/>
    <Slot name="Helmet" itemId="2"/>
    <Slot name="Belt" itemId="3"/>
    <Slot name="Amulet" itemId="4"/>
  </Items>
</PathOfBuilding>`,
  },
];
