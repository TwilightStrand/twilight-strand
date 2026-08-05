import { BinaryWriter, BinaryReader } from "./binary";
import type { Build, Item, Gem, SkillGroup, ConfigOption } from "./types";
import { SCHEMA_VERSION, TSC_PREFIX } from "./types";

// --- Encode ---

function encodeItem(w: BinaryWriter, item: Item): void {
  w.writeString(item.slot);
  w.writeString(item.name);
  w.writeString(item.base);
  w.writeString(item.rarity);
  w.writeVarint(item.mods.length);
  for (const mod of item.mods) w.writeString(mod);
  w.writeVarint(item.quality);
  w.writeString(item.sockets);
}

function encodeGem(w: BinaryWriter, gem: Gem): void {
  w.writeString(gem.name);
  w.writeVarint(gem.level);
  w.writeVarint(gem.quality);
  let flags = 0;
  if (gem.enabled) flags |= 1;
  if (gem.isSupport) flags |= 2;
  w.writeVarint(flags);
  w.writeString(gem.skillId);
}

function encodeSkillGroup(w: BinaryWriter, sg: SkillGroup): void {
  w.writeString(sg.slot);
  w.writeVarint(sg.enabled ? 1 : 0);
  w.writeString(sg.label);
  w.writeVarint(sg.gems.length);
  for (const gem of sg.gems) encodeGem(w, gem);
}

export function encodeBuild(build: Build): Uint8Array {
  const w = new BinaryWriter();

  w.writeVarint(SCHEMA_VERSION);

  // Core
  w.writeVarint(build.level);
  w.writeString(build.className);
  w.writeString(build.ascendancy);
  w.writeVarint(build.mainSocketGroup);
  w.writeString(build.treeVersion);

  // Tree nodes
  w.writeVarint(build.allocatedNodes.length);
  for (const n of build.allocatedNodes) w.writeVarint(n);

  // Items
  w.writeVarint(build.items.length);
  for (const item of build.items) encodeItem(w, item);

  // Skills
  w.writeVarint(build.skills.length);
  for (const sg of build.skills) encodeSkillGroup(w, sg);

  // Config
  w.writeVarint(build.config.length);
  for (const c of build.config) {
    w.writeString(c.key);
    w.writeString(c.value);
  }

  // Notes
  w.writeString(build.notes);

  return w.toUint8Array();
}

// --- Decode ---

function decodeItem(r: BinaryReader): Item {
  const slot = r.readString();
  const name = r.readString();
  const base = r.readString();
  const rarity = r.readString();
  const modCount = r.readVarint();
  const mods: string[] = [];
  for (let i = 0; i < modCount; i++) mods.push(r.readString());
  const quality = r.readVarint();
  const sockets = r.readString();
  return { slot, name, base, rarity, mods, quality, sockets };
}

function decodeGem(r: BinaryReader): Gem {
  const name = r.readString();
  const level = r.readVarint();
  const quality = r.readVarint();
  const flags = r.readVarint();
  const skillId = r.readString();
  return {
    name, level, quality,
    enabled: !!(flags & 1),
    isSupport: !!(flags & 2),
    skillId,
  };
}

function decodeSkillGroup(r: BinaryReader): SkillGroup {
  const slot = r.readString();
  const enabled = r.readVarint() !== 0;
  const label = r.readString();
  const gemCount = r.readVarint();
  const gems: Gem[] = [];
  for (let i = 0; i < gemCount; i++) gems.push(decodeGem(r));
  return { slot, enabled, label, gems };
}

export function decodeBuild(data: Uint8Array): Build {
  const r = new BinaryReader(data);

  const version = r.readVarint();
  if (version !== SCHEMA_VERSION) {
    throw new Error(`Unsupported schema version: ${version} (expected ${SCHEMA_VERSION})`);
  }

  const level = r.readVarint();
  const className = r.readString();
  const ascendancy = r.readString();
  const mainSocketGroup = r.readVarint();
  const treeVersion = r.readString();

  const nodeCount = r.readVarint();
  const allocatedNodes: number[] = [];
  for (let i = 0; i < nodeCount; i++) allocatedNodes.push(r.readVarint());

  const itemCount = r.readVarint();
  const items: Item[] = [];
  for (let i = 0; i < itemCount; i++) items.push(decodeItem(r));

  const skillCount = r.readVarint();
  const skills: SkillGroup[] = [];
  for (let i = 0; i < skillCount; i++) skills.push(decodeSkillGroup(r));

  const configCount = r.readVarint();
  const config: ConfigOption[] = [];
  for (let i = 0; i < configCount; i++) {
    config.push({ key: r.readString(), value: r.readString() });
  }

  const notes = r.readString();

  return {
    level, className, ascendancy, mainSocketGroup, treeVersion,
    allocatedNodes, items, skills, config, notes,
  };
}

// --- PoB XML conversion ---

export function buildToXml(build: Build): string {
  let xml = `<?xml version="1.0"?>\n<PathOfBuilding>\n`;
  xml += `\t<Build level="${build.level}" className="${build.className}" ascendClassName="${build.ascendancy}" mainSocketGroup="${build.mainSocketGroup}" targetVersion="3_0"/>\n`;

  // Skills
  xml += `\t<Skills>\n`;
  for (const sg of build.skills) {
    xml += `\t\t<Skill enabled="${sg.enabled}" slot="${escXml(sg.slot)}" label="${escXml(sg.label)}">\n`;
    for (const gem of sg.gems) {
      xml += `\t\t\t<Gem level="${gem.level}" quality="${gem.quality}" skillId="${escXml(gem.skillId)}" nameSpec="${escXml(gem.name)}" enabled="${gem.enabled}"/>\n`;
    }
    xml += `\t\t</Skill>\n`;
  }
  xml += `\t</Skills>\n`;

  // Tree
  xml += `\t<Tree activeSpec="1">\n\t\t<Spec treeVersion="${build.treeVersion}"><URL></URL></Spec>\n\t</Tree>\n`;

  // Items
  xml += `\t<Items>\n`;
  for (let i = 0; i < build.items.length; i++) {
    const item = build.items[i];
    const id = i + 1;
    xml += `\t\t<Item id="${id}">\n`;
    xml += `Rarity: ${item.rarity}\n`;
    if (item.name) xml += `${item.name}\n`;
    if (item.base && item.base !== item.name) xml += `${item.base}\n`;
    if (item.quality > 0) xml += `Quality: ${item.quality}\n`;
    if (item.sockets) xml += `Sockets: ${item.sockets}\n`;
    if (item.mods.length > 0) {
      xml += `--------\n`;
      for (const mod of item.mods) xml += `${mod}\n`;
      xml += `--------\n`;
    }
    xml += `\t\t</Item>\n`;
    if (item.slot) {
      xml += `\t\t<Slot name="${escXml(item.slot)}" itemId="${id}"/>\n`;
    }
  }
  xml += `\t</Items>\n`;

  // Config
  if (build.config.length > 0) {
    xml += `\t<Config>\n`;
    for (const c of build.config) {
      xml += `\t\t<Input name="${escXml(c.key)}" ${c.value === "true" ? 'boolean="true"' : `string="${escXml(c.value)}"`}/>\n`;
    }
    xml += `\t</Config>\n`;
  }

  // Notes
  if (build.notes) {
    xml += `\t<Notes>${escXml(build.notes)}</Notes>\n`;
  }

  xml += `</PathOfBuilding>`;
  return xml;
}

function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function xmlToBuild(xml: string): Build {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const root = doc.querySelector("PathOfBuilding");
  if (!root) throw new Error("Invalid PoB XML");

  const buildEl = root.querySelector("Build");
  const level = parseInt(buildEl?.getAttribute("level") || "1");
  const className = buildEl?.getAttribute("className") || "Scion";
  const ascendancy = buildEl?.getAttribute("ascendClassName") || "";
  const mainSocketGroup = parseInt(buildEl?.getAttribute("mainSocketGroup") || "1");

  const treeEl = root.querySelector("Tree");
  const specEl = treeEl?.querySelector("Spec");
  const treeVersion = specEl?.getAttribute("treeVersion") || "3_29";

  // Parse tree nodes from URL
  const allocatedNodes: number[] = [];
  const urlEl = specEl?.querySelector("URL");
  if (urlEl?.textContent?.trim()) {
    const url = urlEl.textContent.trim();
    const hashPart = url.split("/").pop() || "";
    if (hashPart) {
      try {
        const decoded = atob(hashPart.replace(/-/g, "+").replace(/_/g, "/"));
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
        if (bytes.length >= 7) {
          for (let i = 7; i < bytes.length - 1; i += 2) {
            allocatedNodes.push((bytes[i] << 8) | bytes[i + 1]);
          }
        }
      } catch { /* invalid tree URL */ }
    }
  }

  // Parse items
  const items: Item[] = [];
  const itemsEl = root.querySelector("Items");
  if (itemsEl) {
    for (const itemEl of itemsEl.querySelectorAll("Item")) {
      const text = itemEl.textContent?.trim() || "";
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      const rarityLine = lines.find(l => l.startsWith("Rarity:"));
      const rarity = rarityLine?.replace("Rarity: ", "") || "Normal";

      let name = "";
      let base = "";
      const contentLines = lines.filter(l => !l.startsWith("Rarity:") && !l.startsWith("<"));
      if (rarity === "UNIQUE" || rarity === "Unique" || rarity === "Rare") {
        name = contentLines[0] || "";
        base = contentLines[1] || "";
      } else {
        base = contentLines[0] || "";
      }

      const mods: string[] = [];
      let pastSep = false;
      for (const line of lines) {
        if (line === "--------") { pastSep = true; continue; }
        if (pastSep && !line.startsWith("Rarity:") && !line.startsWith("<") && !line.startsWith("{")) {
          mods.push(line);
        }
      }

      const id = itemEl.getAttribute("id") || "";
      let slot = "";
      const slotEl = itemsEl.querySelector(`Slot[itemId="${id}"]`);
      if (slotEl) slot = slotEl.getAttribute("name") || "";

      items.push({ slot, name, base, rarity, mods, quality: 0, sockets: "" });
    }
  }

  // Parse skills
  const skills: SkillGroup[] = [];
  const skillsEl = root.querySelector("Skills");
  if (skillsEl) {
    for (const skillEl of skillsEl.querySelectorAll("Skill")) {
      const enabled = skillEl.getAttribute("enabled") !== "false";
      const slot = skillEl.getAttribute("slot") || "";
      const label = skillEl.getAttribute("label") || "";
      const gems: Gem[] = [];
      for (const gemEl of skillEl.querySelectorAll("Gem")) {
        gems.push({
          name: gemEl.getAttribute("nameSpec") || gemEl.getAttribute("skillId") || "",
          level: parseInt(gemEl.getAttribute("level") || "20"),
          quality: parseInt(gemEl.getAttribute("quality") || "0"),
          enabled: gemEl.getAttribute("enabled") !== "false",
          skillId: gemEl.getAttribute("skillId") || "",
          isSupport: (gemEl.getAttribute("skillId") || "").includes("Support"),
        });
      }
      if (gems.length > 0) {
        const activeGem = gems.find(g => !g.isSupport);
        skills.push({ slot, enabled, label: label || activeGem?.name || "Unknown", gems });
      }
    }
  }

  // Parse config
  const config: ConfigOption[] = [];
  const configEl = root.querySelector("Config");
  if (configEl) {
    for (const input of configEl.querySelectorAll("Input")) {
      const key = input.getAttribute("name") || "";
      const value = input.getAttribute("boolean") || input.getAttribute("string") || input.getAttribute("number") || "";
      if (key) config.push({ key, value });
    }
  }

  const notesEl = root.querySelector("Notes");
  const notes = notesEl?.textContent?.trim() || "";

  return {
    level, className, ascendancy, mainSocketGroup, treeVersion,
    allocatedNodes, items, skills, config, notes,
  };
}

// --- Compress/decompress ---

async function compress(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("deflate");
  const writer = cs.writable.getWriter();
  writer.write(data as unknown as BufferSource);
  writer.close();
  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { result.set(c, off); off += c.length; }
  return result;
}

async function decompress(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate");
  const writer = ds.writable.getWriter();
  writer.write(data as unknown as BufferSource);
  writer.close();
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { result.set(c, off); off += c.length; }
  return result;
}

// --- Base64url ---

function toBase64Url(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// --- Public API ---

export async function encodeBuildCode(build: Build): Promise<string> {
  const binary = encodeBuild(build);
  const compressed = await compress(binary);
  return TSC_PREFIX + toBase64Url(compressed);
}

export async function decodeBuildCode(code: string): Promise<Build> {
  if (!code.startsWith(TSC_PREFIX)) {
    throw new Error("Not a TSC build code (expected tsc1_ prefix)");
  }
  const compressed = fromBase64Url(code.slice(TSC_PREFIX.length));
  const binary = await decompress(compressed);
  return decodeBuild(binary);
}

export function isTscCode(input: string): boolean {
  return input.startsWith(TSC_PREFIX);
}
