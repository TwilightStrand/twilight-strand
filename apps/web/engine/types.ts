export interface BuildStats {
  total_dps: number;
  combined_dps: number;
  full_dps: number;
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
  es_regen: number;
  es_recharge_rate: number;
  class_name: string;
  ascendancy: string;
  level: number;
  allocated_nodes: number[];
  main_socket_group: number;
  tree_version: string;
  mastery_effects?: Array<{ nodeId: number; effectId: number }>;
  node_overrides?: Record<string, string[]>;
}

export interface ItemData {
  slot: string;
  name: string;
  base: string;
  rarity: string;
  mods: string[];
  quality: number;
  sockets: string;
  baseArmour?: number;
  baseEvasion?: number;
  baseES?: number;
  baseBlock?: number;
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


