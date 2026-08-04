import type { ClusterNotable } from "@/engine/cluster-types";

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
};
