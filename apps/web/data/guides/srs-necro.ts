import type { BuildGuide } from "@/engine/guide-types";

export const SRS_NECRO_GUIDE: BuildGuide = {
  name: "Summon Raging Spirits Necromancer",
  class: "Witch",
  ascendancy: "Necromancer",
  difficulty: "beginner",
  budget: "low",
  playstyle: "Summon flaming skulls that swarm and melt everything",
  pros: [
    "Strong league starter, scales with gem levels",
    "Tanky via block and minion aggro",
    "Works well on a low budget",
    "Handles most content without gem swaps",
  ],
  cons: [
    "Requires constant casting to maintain skulls",
    "Minion AI can be unpredictable",
    "Clear speed drops in very open maps",
    "Minion survivability needs investment",
  ],
  leveling: [
    {
      level: 1,
      label: "Start with Freezing Pulse",
      gems: [{ name: "Freezing Pulse", slot: "Weapon", links: [] }],
      treePoints: "Path toward minion damage nodes above Witch start",
    },
    {
      level: 4,
      label: "Get SRS from Nessa",
      gems: [
        { name: "Summon Raging Spirits", slot: "Weapon", links: ["Minion Damage"] },
        { name: "Freezing Pulse", slot: "Helmet", links: [] },
      ],
      treePoints: "Pick up Spiritual Aid (minion damage applies to you) if going hybrid",
    },
    {
      level: 18,
      label: "Add Infernal Legion and Minion Speed",
      gems: [
        { name: "Summon Raging Spirits", slot: "Body Armour", links: ["Minion Damage", "Melee Splash", "Minion Speed"] },
        { name: "Flesh Offering", slot: "Weapon", links: [] },
      ],
      treePoints: "Lord of the Dead, then path toward Gravepact",
    },
    {
      level: 28,
      label: "Add Skeletons for single-target",
      gems: [
        { name: "Summon Raging Spirits", slot: "Body Armour", links: ["Minion Damage", "Melee Splash", "Minion Speed"] },
        { name: "Summon Skeletons", slot: "Weapon", links: ["Minion Damage", "Melee Physical Damage"] },
        { name: "Flesh Offering", slot: "Helmet", links: [] },
        { name: "Hatred", slot: "Boots", links: [] },
      ],
      treePoints: "Path toward Enduring Bond and Sacrifice clusters",
    },
    {
      level: 50,
      label: "Lab ascendancy: Mindless Aggression + Unnatural Strength",
      gems: [
        { name: "Summon Raging Spirits", slot: "Body Armour", links: ["Minion Damage", "Melee Splash", "Elemental Damage with Attacks", "Multistrike"] },
        { name: "Summon Skeletons", slot: "Weapon", links: ["Minion Damage", "Melee Physical Damage"] },
        { name: "Flesh Offering", slot: "Helmet", links: ["Desecrate"] },
        { name: "Hatred", slot: "Boots", links: [] },
      ],
      treePoints: "Fill out minion life and minion damage clusters. Pick up block nodes.",
      notes: "Craft a +1 minion gems wand. Use Bone Armour for defence.",
    },
    {
      level: 70,
      label: "Endgame setup",
      gems: [
        { name: "Summon Raging Spirits", slot: "Body Armour", links: ["Minion Damage", "Melee Splash", "Elemental Damage with Attacks", "Multistrike", "Unleash"] },
        { name: "Determination", slot: "Helmet", links: [] },
        { name: "Flesh Offering", slot: "Weapon", links: ["Desecrate", "Bone Offering"] },
        { name: "Hatred", slot: "Boots", links: ["Generosity"] },
        { name: "Convocation", slot: "Gloves", links: [] },
      ],
      treePoints: "Cap block chance. Fill out remaining minion clusters and life.",
      notes: "Target a +2 minion gems staff or dual +1 wand/shield. Use a Ghastly Eye jewel for flat minion damage.",
    },
  ],
};
