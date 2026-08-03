export interface TreeNode {
  id: string;
  skill?: number;
  name?: string;
  icon?: string;
  group: number;
  orbit: number;
  orbitIndex: number;
  out: string[];
  in: string[];
  isNotable?: boolean;
  isKeystone?: boolean;
  isMastery?: boolean;
  isJewelSocket?: boolean;
  isBloodline?: boolean;
  classStartIndex?: number;
  ascendancyName?: string;
  stats?: string[];
  x: number;
  y: number;
}

export interface TreeGroup {
  x: number;
  y: number;
  orbits: number[];
  nodes: string[];
  background?: {
    image: string;
    isHalfImage?: boolean;
    offsetX?: number;
    offsetY?: number;
  };
}

export interface SpriteCoord {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SpriteSheet {
  filename: string;
  coords: Record<string, SpriteCoord>;
}

export interface TreeData {
  nodes: Map<string, TreeNode>;
  groups: Map<string, TreeGroup>;
  classes: Array<{
    name: string;
    base_str: number;
    base_dex: number;
    base_int: number;
    ascendancies: Array<{ name: string }>;
  }>;
  classStartNodes: Map<number, string>;
  sprites: Record<string, Record<string, SpriteSheet[]>>;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  constants: {
    skillsPerOrbit: number[];
    orbitRadii: number[];
  };
  connections: Array<{ from: string; to: string }>;
}

const TWO_PI = Math.PI * 2;

function calcNodePosition(
  group: TreeGroup,
  orbit: number,
  orbitIndex: number,
  skillsPerOrbit: number[],
  orbitRadii: number[]
): { x: number; y: number } {
  if (orbit === 0) {
    return { x: group.x, y: group.y };
  }

  const nodesInOrbit = skillsPerOrbit[orbit] ?? 1;
  const radius = orbitRadii[orbit] ?? 0;
  const angle = (TWO_PI * orbitIndex) / nodesInOrbit - Math.PI / 2;

  return {
    x: group.x + radius * Math.cos(angle),
    y: group.y + radius * Math.sin(angle),
  };
}

export function parseTreeData(raw: Record<string, unknown>): TreeData {
  const rawNodes = raw.nodes as Record<
    string,
    Record<string, unknown>
  >;
  const rawGroups = raw.groups as Record<
    string,
    Record<string, unknown>
  >;
  const constants = raw.constants as {
    skillsPerOrbit: number[];
    orbitRadii: number[];
    classes: Record<string, number>;
  };

  const groups = new Map<string, TreeGroup>();
  for (const [gid, g] of Object.entries(rawGroups)) {
    groups.set(gid, {
      x: g.x as number,
      y: g.y as number,
      orbits: g.orbits as number[],
      nodes: g.nodes as string[],
      background: g.background as TreeGroup["background"],
    });
  }

  const nodes = new Map<string, TreeNode>();
  const classStartNodes = new Map<number, string>();
  const connections: Array<{ from: string; to: string }> = [];

  for (const [nid, n] of Object.entries(rawNodes)) {
    if (nid === "root") continue;

    const group = groups.get(String(n.group));
    if (!group) continue;

    const pos = calcNodePosition(
      group,
      n.orbit as number,
      n.orbitIndex as number,
      constants.skillsPerOrbit,
      constants.orbitRadii
    );

    const node: TreeNode = {
      id: nid,
      skill: n.skill as number | undefined,
      name: n.name as string | undefined,
      icon: n.icon as string | undefined,
      group: n.group as number,
      orbit: n.orbit as number,
      orbitIndex: n.orbitIndex as number,
      out: (n.out as string[]) || [],
      in: (n.in as string[]) || [],
      isNotable: n.isNotable as boolean | undefined,
      isKeystone: n.isKeystone as boolean | undefined,
      isMastery: n.isMastery as boolean | undefined,
      isJewelSocket: n.isJewelSocket as boolean | undefined,
      isBloodline: n.isBloodline as boolean | undefined,
      classStartIndex: n.classStartIndex as number | undefined,
      ascendancyName: n.ascendancyName as string | undefined,
      stats: n.stats as string[] | undefined,
      x: pos.x,
      y: pos.y,
    };

    nodes.set(nid, node);

    if (node.classStartIndex !== undefined) {
      classStartNodes.set(node.classStartIndex, nid);
    }

    for (const outId of node.out) {
      if (outId !== "root" && !connections.some((c) => c.from === outId && c.to === nid)) {
        connections.push({ from: nid, to: outId });
      }
    }
  }

  return {
    nodes,
    groups,
    classes: raw.classes as TreeData["classes"],
    classStartNodes,
    sprites: raw.sprites as TreeData["sprites"],
    bounds: {
      minX: raw.min_x as number,
      maxX: raw.max_x as number,
      minY: raw.min_y as number,
      maxY: raw.max_y as number,
    },
    constants: {
      skillsPerOrbit: constants.skillsPerOrbit,
      orbitRadii: constants.orbitRadii,
    },
    connections,
  };
}
