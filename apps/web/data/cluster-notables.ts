import type { ClusterNotable } from "@/engine/cluster-types";

export interface ClusterBase {
  name: string;
  type: "large" | "medium" | "small";
  notableSlots: number;
  optimalPassives: number;
  pointCostByEnchant: Record<number, number>;
  smallPassiveStat: string;
  notablePool: string[];
}

export const CLUSTER_BASES: ClusterBase[] = [
  {
    name: "Cold Damage",
    type: "large",
    notableSlots: 3,
    optimalPassives: 8,
    pointCostByEnchant: { 8: 5, 10: 6, 11: 7, 12: 7 },
    smallPassiveStat: "12% increased Cold Damage",
    notablePool: ["Blanketed Snow", "Prismatic Heart", "Widespread Destruction", "Doryani's Lesson", "Corrosive Elements", "Disorienting Display", "Snowstorm"],
  },
  {
    name: "Spell Damage",
    type: "large",
    notableSlots: 3,
    optimalPassives: 8,
    pointCostByEnchant: { 8: 5, 10: 6, 11: 7, 12: 7 },
    smallPassiveStat: "12% increased Spell Damage",
    notablePool: ["Prismatic Heart", "Widespread Destruction", "Supercharge", "Corrosive Elements", "Conjured Wall", "Sap Psyche"],
  },
  {
    name: "Elemental Damage",
    type: "large",
    notableSlots: 3,
    optimalPassives: 8,
    pointCostByEnchant: { 8: 5, 10: 6, 11: 7, 12: 7 },
    smallPassiveStat: "10% increased Elemental Damage",
    notablePool: ["Prismatic Heart", "Widespread Destruction", "Doryani's Lesson", "Corrosive Elements", "Disorienting Display"],
  },
  {
    name: "Physical Damage",
    type: "large",
    notableSlots: 3,
    optimalPassives: 8,
    pointCostByEnchant: { 8: 5, 10: 6, 11: 7, 12: 7 },
    smallPassiveStat: "12% increased Physical Damage",
    notablePool: ["Force Multiplier", "Master the Fundamentals", "Vengeful Commander", "Iron Breaker", "Battle-Hardened"],
  },
  {
    name: "Aura Effect",
    type: "large",
    notableSlots: 3,
    optimalPassives: 8,
    pointCostByEnchant: { 8: 5, 10: 6, 11: 7, 12: 7 },
    smallPassiveStat: "6% increased Effect of Non-Curse Auras from your Skills",
    notablePool: ["Vengeful Commander", "Replenishing Presence"],
  },
  {
    name: "Minion Damage",
    type: "large",
    notableSlots: 3,
    optimalPassives: 8,
    pointCostByEnchant: { 8: 5, 10: 6, 11: 7, 12: 7 },
    smallPassiveStat: "10% increased Minion Damage",
    notablePool: ["Renewal", "Vicious Bite"],
  },
  {
    name: "Critical Chance",
    type: "medium",
    notableSlots: 2,
    optimalPassives: 4,
    pointCostByEnchant: { 4: 3, 5: 4 },
    smallPassiveStat: "10% increased Critical Strike Chance",
    notablePool: ["Precise Commander", "Quick Getaway", "Basics of Pain", "Pressure Points"],
  },
  {
    name: "Damage over Time",
    type: "medium",
    notableSlots: 2,
    optimalPassives: 4,
    pointCostByEnchant: { 4: 3, 5: 4 },
    smallPassiveStat: "10% increased Damage over Time",
    notablePool: ["Wasting Affliction", "Brush with Death", "Flow of Life"],
  },
  {
    name: "Spell Crit",
    type: "medium",
    notableSlots: 2,
    optimalPassives: 4,
    pointCostByEnchant: { 4: 3, 5: 4 },
    smallPassiveStat: "10% increased Critical Strike Chance for Spells",
    notablePool: ["Precise Commander", "Quick Getaway"],
  },
  {
    name: "Life",
    type: "small",
    notableSlots: 1,
    optimalPassives: 2,
    pointCostByEnchant: { 2: 3, 3: 3 },
    smallPassiveStat: "4% increased maximum Life",
    notablePool: ["Fettle"],
  },
  {
    name: "Energy Shield",
    type: "small",
    notableSlots: 1,
    optimalPassives: 2,
    pointCostByEnchant: { 2: 3, 3: 3 },
    smallPassiveStat: "6% increased maximum Energy Shield",
    notablePool: ["Energy From Naught"],
  },
];

export const CLUSTER_NOTABLES: Record<string, ClusterNotable> = {
  "Prismatic Heart": {
    name: "Prismatic Heart",
    stats: ["+10% to all Elemental Resistances", "30% increased Elemental Damage"],
    weight: 100,
  },
  "Widespread Destruction": {
    name: "Widespread Destruction",
    stats: ["20% increased Area of Effect", "20% increased Elemental Damage"],
    weight: 200,
  },
  "Doryani's Lesson": {
    name: "Doryani's Lesson",
    stats: ["0.2% of Elemental Damage Leeched as Life"],
    weight: 50,
  },
  "Force Multiplier": {
    name: "Force Multiplier",
    stats: ["25% increased Physical Damage", "10% increased Attack Speed"],
    weight: 100,
  },
  "Master the Fundamentals": {
    name: "Master the Fundamentals",
    stats: ["+15% to all Elemental Resistances", "35% increased Physical Damage", "-50% to Non-Physical Damage"],
    weight: 100,
  },
  "Wasting Affliction": {
    name: "Wasting Affliction",
    stats: ["20% increased Damage over Time", "10% increased Skill Effect Duration"],
    weight: 150,
  },
  "Brush with Death": {
    name: "Brush with Death",
    stats: ["0.5% of Damage over Time Leeched as Life", "20% increased Damage over Time"],
    weight: 100,
  },
  "Precise Commander": {
    name: "Precise Commander",
    stats: ["30% increased Critical Strike Chance", "+15% to Critical Strike Multiplier"],
    weight: 100,
  },
  "Quick Getaway": {
    name: "Quick Getaway",
    stats: ["10% increased Attack Speed", "10% increased Cast Speed", "5% increased Movement Speed"],
    weight: 150,
  },
  "Fettle": {
    name: "Fettle",
    stats: ["+20 to maximum Life", "10% increased maximum Life"],
    weight: 200,
  },
  "Energy From Naught": {
    name: "Energy From Naught",
    stats: ["+100 to maximum Energy Shield"],
    weight: 150,
  },
  "Supercharge": {
    name: "Supercharge",
    stats: ["Lightning Damage with Non-Critical Strikes is Lucky"],
    weight: 50,
  },
  "Blanketed Snow": {
    name: "Blanketed Snow",
    stats: ["Nearby Enemies have -10% to Cold Resistance", "30% increased Cold Damage"],
    weight: 80,
  },
  "Corrosive Elements": {
    name: "Corrosive Elements",
    stats: ["Nearby Enemies have -8% to all Elemental Resistances"],
    weight: 50,
  },
  "Vengeful Commander": {
    name: "Vengeful Commander",
    stats: ["30% increased Effect of Non-Curse Auras from your Skills"],
    weight: 50,
  },
  "Replenishing Presence": {
    name: "Replenishing Presence",
    stats: ["10% increased Effect of Non-Curse Auras from your Skills", "Regenerate 1% of Life per second"],
    weight: 100,
  },
  "Vicious Bite": {
    name: "Vicious Bite",
    stats: ["Minions have +300 to Accuracy Rating", "Minions have 30% increased Critical Strike Chance", "Minions have +15% to Critical Strike Multiplier"],
    weight: 80,
  },
  "Renewal": {
    name: "Renewal",
    stats: ["Minions Regenerate 1% of Life per second", "Minions deal 20% increased Damage"],
    weight: 150,
  },
  "Disorienting Display": {
    name: "Disorienting Display",
    stats: ["25% increased Elemental Damage", "10% chance to Blind nearby Enemies on Kill"],
    weight: 150,
  },
  "Snowstorm": {
    name: "Snowstorm",
    stats: ["10% of Cold Damage taken as Lightning Damage", "35% increased Cold Damage"],
    weight: 100,
  },
};
