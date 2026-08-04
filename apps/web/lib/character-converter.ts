interface PoECharacter {
  name: string;
  class: string;
  level: number;
  league: string;
}

interface PoEItem {
  name?: string;
  typeLine: string;
  identified?: boolean;
  frameType: number;
  inventoryId: string;
  socketedItems?: PoEItem[];
  explicitMods?: string[];
  implicitMods?: string[];
  craftedMods?: string[];
  enchantMods?: string[];
  properties?: Array<{ name: string; values: [string, number][] }>;
  sockets?: Array<{ group: number; attr: string }>;
}

interface PoEPassives {
  hashes: number[];
  hashes_ex?: number[];
  mastery_effects?: Record<string, number>;
}

const FRAME_TO_RARITY: Record<number, string> = {
  0: "Normal",
  1: "Magic",
  2: "Rare",
  3: "Unique",
};

const INVENTORY_TO_SLOT: Record<string, string> = {
  Weapon: "Weapon 1",
  Offhand: "Weapon 2",
  Weapon2: "Weapon 1 Swap",
  Offhand2: "Weapon 2 Swap",
  Helm: "Helmet",
  BodyArmour: "Body Armour",
  Gloves: "Gloves",
  Boots: "Boots",
  Amulet: "Amulet",
  Ring: "Ring 1",
  Ring2: "Ring 2",
  Belt: "Belt",
  Flask: "Flask 1",
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function itemToXml(item: PoEItem, id: number): string {
  const rarity = FRAME_TO_RARITY[item.frameType] || "Normal";
  const lines: string[] = [];
  lines.push(`Rarity: ${rarity}`);
  if (item.name) lines.push(item.name);
  lines.push(item.typeLine);

  if (item.implicitMods?.length) {
    lines.push("--------");
    lines.push("Implicits: " + item.implicitMods.length);
    for (const mod of item.implicitMods) {
      lines.push(`{implicit}${mod}`);
    }
  }

  if (item.explicitMods?.length) {
    lines.push("--------");
    for (const mod of item.explicitMods) {
      lines.push(mod);
    }
  }

  if (item.craftedMods?.length) {
    for (const mod of item.craftedMods) {
      lines.push(`{crafted}${mod}`);
    }
  }

  return `<Item id="${id}">${escapeXml(lines.join("\n"))}</Item>`;
}

const CLASS_BASES: Record<string, string> = {
  Marauder: "Marauder",
  Juggernaut: "Marauder",
  Berserker: "Marauder",
  Chieftain: "Marauder",
  Witch: "Witch",
  Necromancer: "Witch",
  Elementalist: "Witch",
  Occultist: "Witch",
  Ranger: "Ranger",
  Deadeye: "Ranger",
  Raider: "Ranger",
  Warden: "Ranger",
  Pathfinder: "Ranger",
  Duelist: "Duelist",
  Slayer: "Duelist",
  Gladiator: "Duelist",
  Champion: "Duelist",
  Templar: "Templar",
  Inquisitor: "Templar",
  Hierophant: "Templar",
  Guardian: "Templar",
  Shadow: "Shadow",
  Assassin: "Shadow",
  Trickster: "Shadow",
  Saboteur: "Shadow",
  Scion: "Scion",
  Ascendant: "Scion",
};

const CLASS_ORDER = ["Scion", "Marauder", "Ranger", "Witch", "Duelist", "Templar", "Shadow"];

export function convertCharacterToXml(
  character: PoECharacter,
  items: { items: PoEItem[] },
  passives: PoEPassives,
): string {
  const baseClass = CLASS_BASES[character.class] || character.class;
  const isAscendancy = baseClass !== character.class;

  const xml: string[] = [];
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push("<PathOfBuilding>");

  xml.push(
    `<Build level="${character.level}" targetVersion="3_0" className="${escapeXml(baseClass)}" ascendClassName="${escapeXml(isAscendancy ? character.class : "None")}" mainSocketGroup="1"/>`,
  );

  const nodeHashes = passives.hashes || [];
  const classId = CLASS_ORDER.indexOf(baseClass);
  xml.push('<Tree activeSpec="1">');
  xml.push(
    `<Spec treeVersion="3_29" classId="${classId >= 0 ? classId : 0}" ascendClassId="0" nodes="${nodeHashes.join(",")}">`,
  );
  xml.push("<URL></URL>");
  xml.push("</Spec>");
  xml.push("</Tree>");

  xml.push("<Items>");
  const equippedItems = (items.items || []).filter((i) => i.inventoryId);
  let itemId = 1;
  const slots: string[] = [];

  for (const item of equippedItems) {
    xml.push(itemToXml(item, itemId));
    const slot = INVENTORY_TO_SLOT[item.inventoryId] || item.inventoryId;
    slots.push(`<Slot name="${escapeXml(slot)}" itemId="${itemId}"/>`);
    itemId++;
  }

  for (const slot of slots) {
    xml.push(slot);
  }
  xml.push("</Items>");

  xml.push('<Skills activeSkillSet="1">');
  xml.push('<SkillSet id="1">');

  for (const item of equippedItems) {
    if (item.socketedItems?.length) {
      const slot = INVENTORY_TO_SLOT[item.inventoryId] || item.inventoryId;
      xml.push(
        `<Skill mainActiveSkill="1" enabled="true" slot="${escapeXml(slot)}">`,
      );
      for (const gem of item.socketedItems) {
        let level = 20;
        let quality = 0;
        for (const prop of gem.properties || []) {
          if (prop.name === "Level" && prop.values[0])
            level = parseInt(prop.values[0][0]) || 20;
          if (prop.name === "Quality" && prop.values[0])
            quality =
              parseInt(
                prop.values[0][0].replace("+", "").replace("%", ""),
              ) || 0;
        }
        xml.push(
          `<Gem level="${level}" quality="${quality}" skillId="${escapeXml(gem.typeLine.replace(/\s+/g, "").replace("Support", ""))}" nameSpec="${escapeXml(gem.typeLine)}" enabled="true"/>`,
        );
      }
      xml.push("</Skill>");
    }
  }

  xml.push("</SkillSet>");
  xml.push("</Skills>");
  xml.push("</PathOfBuilding>");

  return xml.join("\n");
}
