export type BuildInputKind =
  | "tsc-code" | "pob-code" | "raw-xml"
  | "pastebin-url" | "pobbin-url"
  | "poe-profile-url" | "poe-ninja-url"
  | "unknown";

export function classifyBuildInput(input: string): BuildInputKind {
  const trimmed = input.trim();
  if (trimmed.startsWith("tsc1_")) return "tsc-code";
  if (trimmed.startsWith("<?xml") || trimmed.startsWith("<PathOfBuilding")) return "raw-xml";
  if (trimmed.includes("pastebin.com/")) return "pastebin-url";
  if (trimmed.includes("pobb.in/")) return "pobbin-url";
  if (trimmed.includes("pathofexile.com/account/view-profile/")) return "poe-profile-url";
  if (trimmed.includes("poe.ninja") && trimmed.includes("/char/")) return "poe-ninja-url";
  const cleaned = trimmed.replace(/\s/g, "");
  if (cleaned.length >= 40 && /^[A-Za-z0-9+/=_-]+$/.test(cleaned)) return "pob-code";
  return "unknown";
}

export function parseAccountCharFromUrl(input: string, kind: BuildInputKind): { account: string; character: string } {
  if (kind === "poe-profile-url") {
    const withChar = input.match(/view-profile\/([^/]+)\/characters\??.*?character=([^&#]+)/i);
    if (withChar) {
      return { account: decodeURIComponent(withChar[1]), character: decodeURIComponent(withChar[2]) };
    }
    const simple = input.match(/view-profile\/([^/]+)/);
    return { account: simple ? decodeURIComponent(simple[1]) : "", character: "" };
  }
  const match = input.match(/\/char\/([^/]+)\/([^/?#]+)/);
  return match
    ? { account: decodeURIComponent(match[1]), character: decodeURIComponent(match[2]) }
    : { account: "", character: "" };
}

export function gggDataToXml(
  itemsData: Record<string, unknown>,
  passivesData: Record<string, unknown>,
  charName: string,
): string {
  const character = itemsData.character as Record<string, unknown> | undefined;
  const className = (character?.class as string) || "Scion";
  const level = (character?.level as number) || 1;
  const items = (itemsData.items as Array<Record<string, unknown>>) || [];
  const _hashes = (passivesData.hashes as number[]) || [];

  let xml = `<?xml version="1.0"?>\n<PathOfBuilding>\n`;
  xml += `\t<Build level="${level}" className="${className}" ascendClassName="" mainSocketGroup="1" targetVersion="3_0"/>\n`;

  xml += `\t<Items>\n`;
  const slotMap: Record<string, string> = {
    Helm: "Helmet", BodyArmour: "Body Armour", Gloves: "Gloves", Boots: "Boots",
    Belt: "Belt", Amulet: "Amulet", Ring: "Ring 1", Ring2: "Ring 2",
    Weapon: "Weapon 1", Weapon2: "Weapon 2", Offhand: "Weapon 2",
  };

  let flaskIdx = 1;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const inventoryId = (item.inventoryId as string) || "";
    let slot = slotMap[inventoryId] || "";
    if (inventoryId === "Flask") {
      slot = `Flask ${flaskIdx++}`;
    }

    const rarity = item.frameType === 3 ? "Unique" : item.frameType === 2 ? "Rare" : "Normal";
    const name = (item.name as string)?.replace(/<<.*?>>/g, "") || "";
    const typeLine = (item.typeLine as string) || "";
    const explicitMods = (item.explicitMods as string[]) || [];
    const implicitMods = (item.implicitMods as string[]) || [];

    xml += `\t\t<Item id="${i + 1}">\n`;
    xml += `Rarity: ${rarity}\n`;
    if (name) xml += `${name}\n`;
    xml += `${typeLine}\n`;
    if (implicitMods.length > 0) {
      xml += `Implicits: ${implicitMods.length}\n`;
      for (const mod of implicitMods) xml += `${mod}\n`;
    }
    if (explicitMods.length > 0) {
      xml += `--------\n`;
      for (const mod of explicitMods) xml += `${mod}\n`;
      xml += `--------\n`;
    }
    xml += `\t\t</Item>\n`;
    if (slot) xml += `\t\t<Slot name="${slot}" itemId="${i + 1}"/>\n`;
  }
  xml += `\t</Items>\n`;

  xml += `\t<Skills>\n`;
  for (const item of items) {
    const socketedItems = (item.socketedItems as Array<Record<string, unknown>>) || [];
    if (socketedItems.length === 0) continue;
    const invId = (item.inventoryId as string) || "";

    xml += `\t\t<Skill enabled="true" slot="${slotMap[invId] || ""}">\n`;
    for (const gem of socketedItems) {
      const props = (gem.properties as Array<Record<string, unknown>>) || [];
      const gemLevel = props.find(p => (p.name as string) === "Level")?.values;
      const gemQuality = props.find(p => (p.name as string) === "Quality")?.values;
      const levelStr = String(((gemLevel as unknown[])?.[0] as unknown[])?.[0] || "20").replace(/[^\d]/g, "");
      const qualityStr = String(((gemQuality as unknown[])?.[0] as unknown[])?.[0] || "0").replace(/[^\d]/g, "");

      xml += `\t\t\t<Gem level="${levelStr}" quality="${qualityStr}" skillId="${(gem.typeLine as string || "").replace(/ /g, "")}" nameSpec="${gem.typeLine || ""}" enabled="true"/>\n`;
    }
    xml += `\t\t</Skill>\n`;
  }
  xml += `\t</Skills>\n`;

  xml += `\t<Tree activeSpec="1"><Spec treeVersion="3_29"><URL></URL></Spec></Tree>\n`;
  xml += `\t<Notes>Imported from ${charName}</Notes>\n`;
  xml += `</PathOfBuilding>`;
  return xml;
}
