import type { BuildGuide } from "@/engine/guide-types";

export const RF_JUGGERNAUT_GUIDE: BuildGuide = {
  name: "Righteous Fire Juggernaut",
  class: "Marauder",
  ascendancy: "Juggernaut",
  difficulty: "beginner",
  budget: "low",
  playstyle: "Walk through enemies, everything burns",
  pros: [
    "Very tanky with high regen",
    "Simple playstyle (RF is always on)",
    "Cheap to start, scales well",
    "Great league starter",
  ],
  cons: [
    "Lower single-target DPS than meta builds",
    "Needs specific uniques to feel good",
    "Cannot run no-regen maps",
  ],
  leveling: [
    {
      level: 1,
      label: "Start with Ground Slam",
      gems: [{ name: "Ground Slam", slot: "Weapon", links: [] }],
      treePoints: "Path toward life and fire damage nodes near Marauder start",
      notes: "Use any melee skill until level 28",
    },
    {
      level: 12,
      label: "Get Searing Bond for extra damage",
      gems: [
        { name: "Ground Slam", slot: "Weapon", links: ["Melee Splash"] },
        { name: "Searing Bond", slot: "Helmet", links: [] },
      ],
      treePoints: "Continue toward Resolute Technique",
    },
    {
      level: 28,
      label: "Switch to Righteous Fire",
      gems: [
        { name: "Righteous Fire", slot: "Body Armour", links: ["Burning Damage", "Elemental Focus"] },
        { name: "Fire Trap", slot: "Gloves", links: ["Burning Damage"] },
      ],
      treePoints: "Get life regen nodes, path toward Purity of Fire",
      notes: "You need enough life regen to sustain RF. Use Vitality aura.",
    },
    {
      level: 55,
      label: "Add more supports",
      gems: [
        { name: "Righteous Fire", slot: "Body Armour", links: ["Burning Damage", "Elemental Focus", "Concentrated Effect"] },
        { name: "Fire Trap", slot: "Gloves", links: ["Burning Damage", "Trap and Mine Damage"] },
        { name: "Purity of Fire", slot: "Helmet", links: [] },
        { name: "Vitality", slot: "Helmet", links: [] },
      ],
      treePoints: "Complete Resolute Technique, path toward Endurance Charges",
    },
    {
      level: 70,
      label: "Endgame setup",
      gems: [
        { name: "Righteous Fire", slot: "Body Armour", links: ["Burning Damage", "Elemental Focus", "Concentrated Effect", "Increased Area"] },
        { name: "Fire Trap", slot: "Gloves", links: ["Burning Damage", "Trap and Mine Damage", "Combustion"] },
        { name: "Determination", slot: "Helmet", links: [] },
        { name: "Purity of Fire", slot: "Boots", links: [] },
      ],
      treePoints: "Fill out life wheel, get Unbreakable ascendancy",
    },
  ],
};
