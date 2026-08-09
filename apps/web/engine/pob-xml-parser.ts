import type { BuildStats, GemData, ItemData, SkillGroup } from "./types";

function getAttr(el: Element, name: string): string {
  return el.getAttribute(name) ?? "";
}

function getNumAttr(el: Element, name: string, fallback = 0): number {
  const v = el.getAttribute(name);
  if (!v) return fallback;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export function parsePobXml(xml: string): {
  stats: BuildStats;
  items: ItemData[];
  skills: SkillGroup[];
  notes: string;
  config: Record<string, string | boolean | number>;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const root = doc.querySelector("PathOfBuilding");
  if (!root) throw new Error("Invalid PoB XML: no PathOfBuilding root");

  const stats = extractBuildInfo(root);
  const items = extractItems(root);
  const skills = extractSkills(root);
  const notesEl = root.querySelector("Notes");
  const notes = notesEl?.textContent?.trim() ?? "";
  const config = extractConfig(root);

  return { stats, items, skills, notes, config };
}

function extractConfig(root: Element): Record<string, string | boolean | number> {
  const configEl = root.querySelector("Config");
  if (!configEl) return {};

  const config: Record<string, string | boolean | number> = {};
  const inputs = configEl.querySelectorAll("Input");

  for (const input of inputs) {
    const name = input.getAttribute("name");
    if (!name) continue;

    const boolVal = input.getAttribute("boolean");
    const numVal = input.getAttribute("number");
    const strVal = input.getAttribute("string");

    if (boolVal !== null) {
      config[name] = boolVal === "true";
    } else if (numVal !== null) {
      config[name] = parseFloat(numVal);
    } else if (strVal !== null) {
      config[name] = strVal;
    }
  }

  // Extract max charge counts from PlayerStat elements
  const buildEl = root.querySelector("Build");
  if (buildEl) {
    for (const ps of buildEl.querySelectorAll("PlayerStat")) {
      const stat = ps.getAttribute("stat");
      const val = ps.getAttribute("value");
      if (!stat || !val) continue;
      if (stat === "PowerChargesMax") config["powerCharges"] = parseFloat(val);
      else if (stat === "FrenzyChargesMax") config["frenzyCharges"] = parseFloat(val);
      else if (stat === "EnduranceChargesMax") config["enduranceCharges"] = parseFloat(val);
    }
  }

  return config;
}

function extractBuildInfo(root: Element): BuildStats {
  const build = root.querySelector("Build");

  const className = getAttr(build ?? root, "className") || "Scion";
  const ascendancy = getAttr(build ?? root, "ascendClassName") || "";
  const level = getNumAttr(build ?? root, "level", 1);
  const mainSocketGroup = getNumAttr(build ?? root, "mainSocketGroup", 1);

  const allocatedNodes = extractAllocatedNodes(root);

  const treeEl = root.querySelector("Tree");
  const specEl = treeEl?.querySelector("Spec");
  const treeVersion = specEl?.getAttribute("treeVersion") || "3_29";

  return {
    total_dps: 0,
    combined_dps: 0,
    full_dps: 0,
    total_ehp: 0,
    life: 60 + (level - 1) * 12,
    energy_shield: 0,
    mana: 40 + (level - 1) * 6,
    strength: 20,
    dexterity: 20,
    intelligence: 20,
    armour: 0,
    evasion: 16,
    evade_chance: 0,
    block_chance: 0,
    spell_block: 0,
    suppression: 0,
    phys_reduction: 0,
    fire_res: -60,
    cold_res: -60,
    lightning_res: -60,
    chaos_res: -60,
    fire_res_max: 75,
    cold_res_max: 75,
    lightning_res_max: 75,
    chaos_res_max: 75,
    life_regen: 0,
    mana_regen: 0.9,
    crit_chance: 0,
    crit_multiplier: 150,
    attack_speed: 1.2,
    hit_chance: 5,
    accuracy: 40,
    class_name: className,
    ascendancy,
    level,
    allocated_nodes: allocatedNodes,
    main_socket_group: mainSocketGroup,
    tree_version: treeVersion,
    mana_unreserved: 40 + (level - 1) * 6,
    life_unreserved: 60 + (level - 1) * 12,
    mana_reserved_percent: 0,
    ward: 0,
    total_dps_with_minions: 0,
    bleed_dps: 0,
    poison_dps: 0,
    ignite_dps: 0,
    impale_dps: 0,
    life_leech_rate: 0,
    es_leech_rate: 0,
    es_regen: 0,
    es_recharge_rate: 0,
  };
}

function extractAllocatedNodes(root: Element): number[] {
  const treeEl = root.querySelector("Tree");
  if (!treeEl) return [];

  const activeSpec = getNumAttr(treeEl, "activeSpec", 1);
  const specs = treeEl.querySelectorAll("Spec");
  const spec = specs[activeSpec - 1] ?? specs[0];
  if (!spec) return [];

  const urlEl = spec.querySelector("URL");
  if (!urlEl?.textContent) return [];

  const url = urlEl.textContent.trim();
  const hashPart = url.split("/").pop() ?? "";
  if (!hashPart) return [];

  try {
    const decoded = atob(hashPart.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    // PoE tree URL format: version(4 bytes) + classId(1 byte) + ascId(1 byte) + fullscreen(1 byte) + nodeIds(2 bytes each)
    if (bytes.length < 7) return [];
    const nodes: number[] = [];
    for (let i = 7; i < bytes.length - 1; i += 2) {
      nodes.push((bytes[i] << 8) | bytes[i + 1]);
    }
    return nodes;
  } catch {
    return [];
  }
}

/** Strip all leading {tag} prefixes from a PoB mod line (e.g. {tags:resistance}{range:1}+30%) */
function stripTagPrefixes(line: string): string {
  let s = line;
  while (s.startsWith("{")) {
    const end = s.indexOf("}");
    if (end === -1) break;
    s = s.slice(end + 1).trim();
  }
  // Also strip (crafted)/(enchant)/(implicit) text prefixes
  for (const prefix of ["(crafted)", "(enchant)", "(implicit)", "(fractured)"]) {
    if (s.startsWith(prefix)) {
      s = s.slice(prefix.length).trim();
    }
  }
  return s;
}

function extractItems(root: Element): ItemData[] {
  const itemsEl = root.querySelector("Items");
  if (!itemsEl) return [];

  const items: ItemData[] = [];
  const itemEls = itemsEl.querySelectorAll("Item");

  for (const el of itemEls) {
    const text = el.textContent?.trim() ?? "";
    if (!text) continue;

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) continue;

    const rarity = lines[0].startsWith("Rarity:") ? lines[0].replace("Rarity: ", "") : "Normal";
    const name = lines.length > 2 && !lines[1].startsWith("{") ? lines[1] : "";
    const base = lines.find((l) => !l.startsWith("Rarity:") && !l.startsWith("{") && l !== name) ?? "";

    const mods: string[] = [];
    let baseArmour = 0;
    let baseEvasion = 0;
    let baseES = 0;
    let baseBlock = 0;

    // PoB items come in two formats:
    // 1. Clipboard format: sections split by "--------" separators
    // 2. Internal save format: no separators, uses "Implicits: N" as boundary
    // We handle both by matching defence headers and mods regardless of separators.

    const METADATA_RE = /^(Rarity:|Crafted:|Prefix:|Suffix:|Quality:|LevelReq:|Item Level:|Unique ID:|League:|Implicits:|Sockets:|Selected Variant:|Variant:|Limited to:|Radius:|Has Alt Variant|Has Alt Variant Two|Has Alt Variant Three|ArmourBasePercentile:|EnergyShieldBasePercentile:|EvasionBasePercentile:|Searing Exarch Item|Eater of Worlds Item|Requires |<ModRange)/;

    let inModSection = false;
    let implicitsRemaining = -1;

    for (const line of lines) {
      if (line === "--------") {
        inModSection = true;
        continue;
      }

      // Defence stats can appear in the header (both formats)
      const defMatch = line.match(/^(Armour|Evasion Rating|Energy Shield|Chance to Block):\s*(\d+)/);
      if (defMatch) {
        const val = parseInt(defMatch[2], 10);
        if (defMatch[1] === "Armour") baseArmour = val;
        else if (defMatch[1] === "Evasion Rating") baseEvasion = val;
        else if (defMatch[1] === "Energy Shield") baseES = val;
        else if (defMatch[1] === "Chance to Block") baseBlock = val;
        continue;
      }

      // "Implicits: N" marks the start of mods in the internal format
      const implMatch = line.match(/^Implicits:\s*(\d+)/);
      if (implMatch) {
        implicitsRemaining = parseInt(implMatch[1], 10);
        inModSection = true;
        continue;
      }

      if (!inModSection) continue;

      // Track implicit mod count (they come right after "Implicits: N")
      if (implicitsRemaining > 0) {
        implicitsRemaining--;
        // Implicit mods are still mods; strip {tag} prefixes before adding
        mods.push(stripTagPrefixes(line));
        continue;
      }

      // Skip metadata lines that aren't actual mods
      if (METADATA_RE.test(line)) continue;

      // Everything else in the mod section is an explicit mod
      // Strip PoB tag prefixes like {tags:...}, {crafted}, {range:...}, {exarch}, etc.
      const stripped = stripTagPrefixes(line);
      if (stripped && !stripped.startsWith("Rarity:")) {
        mods.push(stripped);
      }
    }

    const id = getAttr(el, "id");
    const slot = findSlotForItem(itemsEl, id);

    items.push({
      slot,
      name: name || base,
      base,
      rarity,
      mods,
      quality: 0,
      sockets: "",
      baseArmour: baseArmour || undefined,
      baseEvasion: baseEvasion || undefined,
      baseES: baseES || undefined,
      baseBlock: baseBlock || undefined,
    });
  }

  return items;
}

function findSlotForItem(itemsEl: Element, itemId: string): string {
  const slots = itemsEl.querySelectorAll("Slot");
  for (const slot of slots) {
    if (getAttr(slot, "itemId") === itemId) {
      return getAttr(slot, "name");
    }
  }
  return "";
}

function extractSkills(root: Element): SkillGroup[] {
  const skillsEl = root.querySelector("Skills");
  if (!skillsEl) return [];

  const groups: SkillGroup[] = [];
  const skillEls = skillsEl.querySelectorAll("Skill");

  for (const skillEl of skillEls) {
    const enabled = getAttr(skillEl, "enabled") !== "false";
    const slot = getAttr(skillEl, "slot");
    const label = getAttr(skillEl, "label") || "";

    const gems: GemData[] = [];
    const gemEls = skillEl.querySelectorAll("Gem");

    for (const gemEl of gemEls) {
      gems.push({
        name: getAttr(gemEl, "nameSpec") || getAttr(gemEl, "skillId"),
        level: getNumAttr(gemEl, "level", 20),
        quality: getNumAttr(gemEl, "quality", 0),
        enabled: getAttr(gemEl, "enabled") !== "false",
        skillId: getAttr(gemEl, "skillId"),
        isSupport: getAttr(gemEl, "skillId").includes("Support"),
      });
    }

    if (gems.length > 0) {
      const activeGem = gems.find((g) => !g.isSupport);
      groups.push({
        slot,
        enabled,
        gems,
        label: label || activeGem?.name || "Unknown",
      });
    }
  }

  return groups;
}
