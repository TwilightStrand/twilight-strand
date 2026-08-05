#!/usr/bin/env node
/**
 * Generates config options from PoB's ConfigOptions.lua.
 * Extracts: var, type, label, list options, section, and conditional visibility.
 *
 * Usage: node scripts/gen-config-options.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = resolve(
  __dirname,
  "../public/data/pob/Modules/ConfigOptions.lua"
);
const OUT = resolve(__dirname, "../data/config-options.generated.ts");

function stripColorCodes(s) {
  return s.replace(/\^x[0-9A-Fa-f]{6}/g, "").replace(/\^\d/g, "");
}

function extractQuoted(line, key) {
  const re = new RegExp(`${key}\\s*=\\s*"([^"]*)"`, "g");
  const match = re.exec(line);
  return match ? match[1] : null;
}

function extractBool(line, key) {
  const re = new RegExp(`${key}\\s*=\\s*(true|false)`);
  const match = re.exec(line);
  return match ? match[1] === "true" : null;
}

function extractNumber(line, key) {
  const re = new RegExp(`${key}\\s*=\\s*(-?\\d+)`);
  const match = re.exec(line);
  return match ? parseInt(match[1]) : null;
}

function extractIfSkill(line) {
  // ifSkill = "Cyclone" or ifSkill = { "A", "B" }
  const single = line.match(/ifSkill\s*=\s*"([^"]+)"/);
  if (single) return [single[1]];
  const multi = line.match(/ifSkill\s*=\s*\{([^}]+)\}/);
  if (multi) {
    return [...multi[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  }
  return null;
}

function extractIfCond(line) {
  const single = line.match(/ifCond\s*=\s*"([^"]+)"/);
  if (single) return [single[1]];
  const multi = line.match(/ifCond\s*=\s*\{([^}]+)\}/);
  if (multi) {
    return [...multi[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  }
  return null;
}

function extractIfFlag(line) {
  const single = line.match(/ifFlag\s*=\s*"([^"]+)"/);
  if (single) return [single[1]];
  return null;
}

function extractListOptions(text, startIdx) {
  // Find list = { ... } which may span multiple lines
  const listStart = text.indexOf("list = {", startIdx);
  if (listStart === -1 || listStart > startIdx + 2000) return null;

  let depth = 0;
  let start = -1;
  for (let i = listStart + 7; i < text.length; i++) {
    if (text[i] === "{") {
      if (start === -1) start = i;
      depth++;
    }
    if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        const listStr = text.substring(start, i + 1);
        const options = [];
        const entryRe = /\{[^}]*val\s*=\s*("([^"]*)"|([-\d.]+))[^}]*label\s*=\s*"([^"]*)"[^}]*\}|\{[^}]*label\s*=\s*"([^"]*)"[^}]*val\s*=\s*("([^"]*)"|([-\d.]+))[^}]*\}/g;
        let m;
        while ((m = entryRe.exec(listStr)) !== null) {
          const val = m[2] ?? m[7] ?? (m[3] ? parseFloat(m[3]) : null) ?? (m[8] ? parseFloat(m[8]) : null);
          const label = stripColorCodes(m[4] || m[5] || "");
          if (val !== null && label) {
            options.push({ val, label });
          }
        }
        return options.length > 0 ? options : null;
      }
    }
  }
  return null;
}

function parseConfigOptions(text) {
  const entries = [];
  let currentSection = "General";

  // Split into lines but track position for multi-line list parsing
  const lines = text.split("\n");
  let pos = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const linePos = pos;
    pos += line.length + 1;

    // Section headers
    const sectionMatch = line.match(/\{\s*section\s*=\s*"([^"]+)"/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }

    // Category labels (no var, just label with ifSkill)
    const labelOnly = line.match(
      /^\s*\{\s*label\s*=\s*"([^"]+):"\s*,\s*ifSkill/
    );
    if (labelOnly && !line.includes("var =")) {
      continue; // Skip skill-specific section headers
    }

    // Config option entries
    const varMatch = line.match(/\{\s*var\s*=\s*"([^"]+)"/);
    if (!varMatch) continue;

    const varName = varMatch[1];
    const type = extractQuoted(line, "type");
    const rawLabel = extractQuoted(line, "label");
    if (!type || !rawLabel) continue;

    const label = stripColorCodes(rawLabel);
    const ifSkill = extractIfSkill(line);
    const ifCond = extractIfCond(line);
    const ifFlag = extractIfFlag(line);
    const ifSkillData = extractQuoted(line, "ifSkillData");
    const ifMinionCond = extractQuoted(line, "ifMinionCond");
    const ifSkillFlag = extractQuoted(line, "ifSkillFlag");
    const defaultIndex = extractNumber(line, "defaultIndex");

    const entry = {
      var: varName,
      type,
      label,
      section: currentSection,
    };

    if (type === "list") {
      const options = extractListOptions(text, linePos);
      if (options) {
        entry.options = options;
      }
      if (defaultIndex !== null) {
        entry.defaultIndex = defaultIndex;
      }
    }

    // Conditional visibility
    const visibility = {};
    if (ifSkill) visibility.ifSkill = ifSkill;
    if (ifCond) visibility.ifCond = ifCond;
    if (ifFlag) visibility.ifFlag = ifFlag;
    if (ifSkillData) visibility.ifSkillData = ifSkillData;
    if (ifMinionCond) visibility.ifMinionCond = ifMinionCond;
    if (ifSkillFlag) visibility.ifSkillFlag = ifSkillFlag;
    if (Object.keys(visibility).length > 0) {
      entry.visibility = visibility;
    }

    entries.push(entry);
  }

  return entries;
}

const raw = readFileSync(CONFIG_FILE, "utf-8");
const entries = parseConfigOptions(raw);

// Map PoB types to our types
function mapType(t) {
  switch (t) {
    case "check":
      return "check";
    case "count":
    case "countAllowZero":
    case "integer":
    case "float":
      return "number";
    case "list":
      return "select";
    case "text":
      return "text";
    default:
      return "check";
  }
}

const mapped = entries.map((e) => {
  const out = {
    id: e.var,
    type: mapType(e.type),
    label: e.label,
    section: e.section,
  };
  if (e.options) {
    out.options = e.options;
  }
  if (e.defaultIndex !== undefined) {
    out.defaultIndex = e.defaultIndex;
  }
  if (e.visibility) {
    out.visibility = e.visibility;
  }
  return out;
});

// Group by section for summary
const bySection = {};
for (const e of mapped) {
  bySection[e.section] = (bySection[e.section] || 0) + 1;
}

const output = `// Auto-generated from PoB ConfigOptions.lua - do not edit
// Generated: ${new Date().toISOString().split("T")[0]}
// Source: apps/web/public/data/pob/Modules/ConfigOptions.lua

export interface ConfigOptionDef {
  id: string;
  type: "check" | "number" | "select" | "text";
  label: string;
  section: string;
  options?: { val: string | number; label: string }[];
  defaultIndex?: number;
  visibility?: {
    ifSkill?: string[];
    ifCond?: string[];
    ifFlag?: string[];
    ifSkillData?: string;
    ifMinionCond?: string;
    ifSkillFlag?: string;
  };
}

// ${mapped.length} config options across ${Object.keys(bySection).length} sections
// ${Object.entries(bySection).map(([k, v]) => `${k}: ${v}`).join(", ")}
export const CONFIG_OPTIONS: ConfigOptionDef[] = ${JSON.stringify(mapped, null, 2)};

export const CONFIG_SECTIONS = ${JSON.stringify(Object.keys(bySection))} as const;
`;

writeFileSync(OUT, output);
console.log(
  `Generated ${mapped.length} config options across ${Object.keys(bySection).length} sections → ${OUT}`
);
for (const [section, count] of Object.entries(bySection)) {
  console.log(`  ${section}: ${count}`);
}
