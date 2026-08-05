import type { BuildGuide } from "@/engine/guide-types";

export const LA_DEADEYE_GUIDE: BuildGuide = {
  name: "Lightning Arrow Deadeye",
  class: "Ranger",
  ascendancy: "Deadeye",
  difficulty: "intermediate",
  budget: "medium",
  playstyle: "Fast-paced bow gameplay with screen-wide lightning explosions",
  pros: [
    "Excellent clear speed with chain and pierce",
    "Good scaling into endgame with gear investment",
    "Fast movement with bow mechanics",
    "Satisfying visual feedback",
  ],
  cons: [
    "Squishy without good gear",
    "Single-target needs separate setup",
    "Requires accuracy investment early",
    "Gem swaps for bossing",
  ],
  leveling: [
    {
      level: 1,
      label: "Start with Burning Arrow",
      gems: [{ name: "Burning Arrow", slot: "Weapon", links: [] }],
      treePoints: "Path toward projectile damage and life nodes near Ranger start",
    },
    {
      level: 12,
      label: "Switch to Lightning Arrow",
      gems: [
        { name: "Lightning Arrow", slot: "Weapon", links: ["Added Lightning Damage"] },
      ],
      treePoints: "Pick up Acuity and early bow nodes",
    },
    {
      level: 28,
      label: "Add Herald of Thunder and supports",
      gems: [
        { name: "Lightning Arrow", slot: "Weapon", links: ["Added Lightning Damage", "Elemental Damage with Attacks"] },
        { name: "Herald of Thunder", slot: "Helmet", links: [] },
      ],
      treePoints: "Path toward King of the Hill, pick up life along the way",
    },
    {
      level: 38,
      label: "4-link setup with Trinity",
      gems: [
        { name: "Lightning Arrow", slot: "Body Armour", links: ["Trinity", "Elemental Damage with Attacks", "Added Lightning Damage"] },
        { name: "Herald of Thunder", slot: "Helmet", links: [] },
        { name: "Wrath", slot: "Weapon", links: [] },
      ],
      treePoints: "Path toward Ballistic Mastery cluster",
    },
    {
      level: 55,
      label: "Lab ascendancy: Gathering Winds",
      gems: [
        { name: "Lightning Arrow", slot: "Body Armour", links: ["Trinity", "Elemental Damage with Attacks", "Greater Multiple Projectiles", "Inspiration"] },
        { name: "Barrage", slot: "Weapon", links: ["Trinity", "Elemental Damage with Attacks"] },
        { name: "Wrath", slot: "Helmet", links: [] },
      ],
      treePoints: "Continue toward crit clusters above Shadow area",
      notes: "Barrage is your single-target swap for bosses",
    },
    {
      level: 70,
      label: "Endgame setup",
      gems: [
        { name: "Lightning Arrow", slot: "Body Armour", links: ["Trinity", "Elemental Damage with Attacks", "Greater Multiple Projectiles", "Inspiration", "Added Lightning Damage"] },
        { name: "Barrage", slot: "Weapon", links: ["Trinity", "Elemental Damage with Attacks", "Slower Projectiles"] },
        { name: "Wrath", slot: "Helmet", links: ["Divine Blessing", "Inspiration"] },
        { name: "Grace", slot: "Boots", links: [] },
      ],
      treePoints: "Fill out crit multi, life, and evasion nodes. Path to Acrobatics.",
      notes: "Look for a 6L bow with flat lightning. Consider Hyrri's Ire for body armour.",
    },
  ],
};
