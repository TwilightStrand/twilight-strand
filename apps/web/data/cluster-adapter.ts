/**
 * Adapter that bridges auto-generated cluster data into the shape
 * the ClusterSearch component expects.
 */
import {
  CLUSTER_BASES as GEN_BASES,
  CLUSTER_NOTABLES as GEN_NOTABLES,
  type ClusterBaseData,
  type ClusterNotableData,
} from "./cluster-data.generated";

export interface ClusterBase {
  name: string;
  tag: string;
  type: "large" | "medium" | "small";
  notableSlots: number;
  optimalPassives: number;
  pointCostByEnchant: Record<number, number>;
  smallPassiveStat: string;
  notablePool: string[];
}

export interface ClusterNotable {
  name: string;
  stats: string[];
  weight: number;
  level: number;
}

const POINT_COSTS: Record<string, Record<number, number>> = {
  large:  { 8: 5, 10: 6, 11: 7, 12: 7 },
  medium: { 4: 3, 5: 4 },
  small:  { 2: 3, 3: 3 },
};

const NOTABLE_SLOTS: Record<string, number> = {
  large: 3,
  medium: 2,
  small: 1,
};

const OPTIMAL_PASSIVES: Record<string, number> = {
  large: 8,
  medium: 4,
  small: 2,
};

export const CLUSTER_BASES: ClusterBase[] = GEN_BASES.map((b) => ({
  name: b.name,
  tag: b.tag,
  type: b.type,
  notableSlots: NOTABLE_SLOTS[b.type] ?? 2,
  optimalPassives: OPTIMAL_PASSIVES[b.type] ?? 4,
  pointCostByEnchant: POINT_COSTS[b.type] ?? { 4: 3 },
  smallPassiveStat: b.smallPassiveStats[0] ?? "",
  notablePool: b.notablePool.filter((n) => n in GEN_NOTABLES),
}));

export const CLUSTER_NOTABLES: Record<string, ClusterNotable> = {};
for (const [name, data] of Object.entries(GEN_NOTABLES)) {
  const weights = Object.values(data.weights);
  const avgWeight = weights.length > 0
    ? weights.reduce((a, b) => a + b, 0) / weights.length
    : 100;
  CLUSTER_NOTABLES[name] = {
    name: data.name,
    stats: data.stats,
    weight: Math.round(avgWeight),
    level: data.level,
  };
}
