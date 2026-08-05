// --- Full-fidelity build transport format ---
// Lossless: can reconstruct PoB XML from this data.
// Binary encoded: much smaller than XML.

export interface Item {
  slot: string;
  name: string;
  base: string;
  rarity: string;
  mods: string[];       // raw mod text lines, preserved exactly
  quality: number;
  sockets: string;
}

export interface Gem {
  name: string;
  level: number;
  quality: number;
  enabled: boolean;
  skillId: string;
  isSupport: boolean;
}

export interface SkillGroup {
  slot: string;
  enabled: boolean;
  label: string;
  gems: Gem[];
}

export interface ConfigOption {
  key: string;
  value: string;
}

export interface Build {
  // Core
  level: number;
  className: string;
  ascendancy: string;
  mainSocketGroup: number;
  treeVersion: string;

  // Tree
  allocatedNodes: number[];

  // Gear + skills
  items: Item[];
  skills: SkillGroup[];

  // Config
  config: ConfigOption[];

  // Metadata
  notes: string;
}

export const TSC_PREFIX = "tsc1_";
export const SCHEMA_VERSION = 1;
