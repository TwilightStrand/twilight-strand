export interface ClusterJewelBase {
  name: string;
  type: "large" | "medium" | "small";
  enchant: string;
  passiveCount: number;
  notables: string[];
  smallPassiveType: string;
}

export interface ClusterNotable {
  name: string;
  stats: string[];
  weight: number;
  tags?: string[];
}

export interface ClusterSearchResult {
  jewel: ClusterJewelBase;
  notables: ClusterNotable[];
  estimatedPrice: number;
  dpsGain: number;
  ehpGain: number;
  valueScore: number;
}

export interface ClusterSearchParams {
  type: "large" | "medium" | "small" | "any";
  maxPrice: number;
  sortBy: "dps" | "ehp" | "value" | "price";
  minDpsGain: number;
}
