export interface LevelingStep {
  level: number;
  label: string;
  gems: Array<{ name: string; slot: string; links: string[] }>;
  treePoints: string;
  notes?: string;
}

export interface BuildGuide {
  name: string;
  class: string;
  ascendancy: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  budget: "low" | "medium" | "high";
  playstyle: string;
  pros: string[];
  cons: string[];
  leveling: LevelingStep[];
  endgamePobCode?: string;
}
