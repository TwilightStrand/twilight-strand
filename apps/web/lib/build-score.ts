import type { BuildStats } from "@/engine/types";

export function calculateBuildScore(stats: BuildStats): { score: number; grade: string; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  const dps = stats.total_dps || stats.combined_dps || 0;
  breakdown.dps = Math.min(25, Math.log10(Math.max(1, dps)) * 3);

  const ehp = stats.total_ehp || (stats.life + stats.energy_shield);
  breakdown.survivability = Math.min(25, Math.log10(Math.max(1, ehp)) * 5);

  const avgRes = (Math.max(0, stats.fire_res) + Math.max(0, stats.cold_res) + Math.max(0, stats.lightning_res)) / 3;
  breakdown.resistances = Math.min(25, (avgRes / 75) * 25);

  const mitigation = stats.block_chance + stats.spell_block + stats.suppression + stats.phys_reduction;
  breakdown.mitigation = Math.min(25, mitigation / 4);

  const score = Math.round(Object.values(breakdown).reduce((a, b) => a + b, 0));

  let grade: string;
  if (score >= 85) grade = "S";
  else if (score >= 70) grade = "A";
  else if (score >= 55) grade = "B";
  else if (score >= 40) grade = "C";
  else if (score >= 25) grade = "D";
  else grade = "F";

  return { score, grade, breakdown };
}
