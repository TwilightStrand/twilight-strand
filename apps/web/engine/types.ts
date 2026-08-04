export type GameId = "poe1" | "poe2";

export interface BuildStats {
  total_dps: number;
  combined_dps: number;
  total_ehp: number;
  life: number;
  energy_shield: number;
  mana: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  armour: number;
  evasion: number;
  evade_chance: number;
  block_chance: number;
  spell_block: number;
  suppression: number;
  phys_reduction: number;
  fire_res: number;
  cold_res: number;
  lightning_res: number;
  chaos_res: number;
  fire_res_max: number;
  cold_res_max: number;
  lightning_res_max: number;
  chaos_res_max: number;
  life_regen: number;
  mana_regen: number;
  mana_unreserved: number;
  life_unreserved: number;
  mana_reserved_percent: number;
  crit_chance: number;
  crit_multiplier: number;
  attack_speed: number;
  hit_chance: number;
  accuracy: number;
  ward: number;
  total_dps_with_minions: number;
  bleed_dps: number;
  poison_dps: number;
  ignite_dps: number;
  impale_dps: number;
  life_leech_rate: number;
  es_leech_rate: number;
  class_name: string;
  ascendancy: string;
  level: number;
  allocated_nodes: number[];
  main_socket_group: number;
  tree_version: string;
}

export interface ItemData {
  slot: string;
  name: string;
  base: string;
  rarity: string;
  mods: string[];
  quality: number;
  sockets: string;
}

export interface SkillGroup {
  slot: string;
  enabled: boolean;
  gems: GemData[];
  label: string;
  dps?: number;
}

export interface GemData {
  name: string;
  level: number;
  quality: number;
  enabled: boolean;
  skillId: string;
  isSupport: boolean;
}

export type EngineRequest =
  | { id: number; type: "init"; gameId: GameId }
  | { id: number; type: "evaluate"; xml: string }
  | { id: number; type: "ping" };

export type EngineResponse =
  | { id: number; type: "ready" }
  | { id: number; type: "evaluated"; stats: BuildStats; items: ItemData[]; skills: SkillGroup[] }
  | { id: number; type: "pong" }
  | { id: number; type: "error"; message: string }
  | { id: number; type: "progress"; stage: string };
