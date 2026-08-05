#!/usr/bin/env node
/**
 * Pre-decompresses timeless jewel zip files to .bin files so the Lua VM
 * can read them directly without needing a runtime Inflate implementation.
 * PoB's loadJewelFile() checks for .bin files first.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { inflateSync } from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const JEWEL_DIR = resolve(__dirname, "../public/data/pob/Data/TimelessJewelData");

const jewelTypes = [
  "AbyssAmanamu", "AbyssKurgal", "AbyssTecrod", "AbyssUlaman", "AbyssZorath",
  "BrutalRestraint", "ElegantHubris", "HeroicTragedy", "LethalPride", "MilitantFaith",
  "GloriousVanity",
];

let total = 0;

for (const name of jewelTypes) {
  const binPath = resolve(JEWEL_DIR, `${name}.bin`);

  let compressed;
  const zipPath = resolve(JEWEL_DIR, `${name}.zip`);
  if (existsSync(zipPath)) {
    compressed = readFileSync(zipPath);
  } else {
    // Handle split parts (GloriousVanity)
    const parts = [];
    for (let i = 0; ; i++) {
      const partPath = resolve(JEWEL_DIR, `${name}.zip.part${i}`);
      if (!existsSync(partPath)) break;
      parts.push(readFileSync(partPath));
    }
    if (parts.length === 0) {
      console.warn(`  SKIP ${name}: no .zip or .zip.part* found`);
      continue;
    }
    compressed = Buffer.concat(parts);
  }

  try {
    const decompressed = inflateSync(compressed);
    writeFileSync(binPath, decompressed);
    console.log(`  ${name}: ${(compressed.length / 1024 / 1024).toFixed(1)} MB -> ${(decompressed.length / 1024 / 1024).toFixed(1)} MB`);
    total++;
  } catch (e) {
    console.error(`  ERROR ${name}: ${e.message}`);
  }
}

console.log(`\nDecompressed ${total} jewel data files`);
