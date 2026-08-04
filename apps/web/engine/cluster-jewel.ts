export interface ClusterJewelNode {
  id: string;
  name: string;
  stats: string[];
  type: "small" | "notable" | "socket";
  position: number;
}

export interface ClusterJewelData {
  baseType: string;
  enchant: string;
  passiveCount: number;
  nodes: ClusterJewelNode[];
  notableNames: string[];
  smallPassiveStats: string[];
}

export function parseClusterJewel(itemMods: string[]): ClusterJewelData | null {
  let passiveCount = 0;
  let enchant = "";
  const notableNames: string[] = [];
  const smallPassiveStats: string[] = [];
  let baseType = "Cluster Jewel";

  for (const mod of itemMods) {
    const countMatch = mod.match(/adds (\d+) passive skills?/i);
    if (countMatch) {
      passiveCount = parseInt(countMatch[1]);
      enchant = mod;
    }

    const notableMatch = mod.match(/added passive skill is (.+)/i);
    if (notableMatch) {
      notableNames.push(notableMatch[1].trim());
    }

    const smallMatch = mod.match(/added small passive skills grant: (.+)/i);
    if (smallMatch) {
      smallPassiveStats.push(smallMatch[1].trim());
    }

    if (mod.toLowerCase().includes("large cluster")) baseType = "Large Cluster Jewel";
    if (mod.toLowerCase().includes("medium cluster")) baseType = "Medium Cluster Jewel";
    if (mod.toLowerCase().includes("small cluster")) baseType = "Small Cluster Jewel";
  }

  if (passiveCount === 0) return null;

  const namesLeft = [...notableNames];
  const nodes: ClusterJewelNode[] = [];
  for (let i = 0; i < passiveCount; i++) {
    const isSocket = passiveCount >= 8 && i === passiveCount - 1;
    const isNotable =
      namesLeft.length > 0 &&
      !isSocket &&
      (passiveCount <= 4
        ? i === passiveCount - 1
        : i === Math.floor(passiveCount / 3) || i === Math.floor((2 * passiveCount) / 3));

    if (isSocket) {
      nodes.push({ id: `cluster-socket-${i}`, name: "Jewel Socket", stats: [], type: "socket", position: i });
    } else if (isNotable) {
      nodes.push({ id: `cluster-notable-${i}`, name: namesLeft.shift()!, stats: [], type: "notable", position: i });
    } else {
      nodes.push({ id: `cluster-small-${i}`, name: "Small Passive", stats: smallPassiveStats, type: "small", position: i });
    }
  }

  return { baseType, enchant, passiveCount, nodes, notableNames: [...notableNames], smallPassiveStats };
}
