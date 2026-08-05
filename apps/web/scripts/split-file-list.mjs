#!/usr/bin/env node
/**
 * Splits file-list.json into essential (needed for boot) and deferred (loaded lazily).
 * Old tree versions, ruthless variants, and alternate trees are deferred.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { statSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POB_DIR = resolve(__dirname, "../public/data/pob");
const INPUT = resolve(POB_DIR, "file-list.json");
const ESSENTIAL_OUT = resolve(POB_DIR, "file-list-essential.json");
const DEFERRED_OUT = resolve(POB_DIR, "file-list-deferred.json");

const files = JSON.parse(readFileSync(INPUT, "utf-8"));

const CURRENT_TREE = "3_29";

const essential = [];
const deferred = [];

for (const file of files) {
  const isTreeLua = file.includes("TreeData/") && file.endsWith("tree.lua");
  const isCurrentTree = file.includes(`TreeData/${CURRENT_TREE}/`);
  const isRuthless = file.includes("ruthless");
  const isAlternate = file.includes("alternate");
  const isOldTree = isTreeLua && !isCurrentTree;
  const isTimelessData = file.includes("TimelessJewelData/");

  if (isOldTree || isRuthless || isAlternate || isTimelessData) {
    deferred.push(file);
  } else {
    essential.push(file);
  }
}

let essentialSize = 0, deferredSize = 0;
for (const f of essential) {
  try { essentialSize += statSync(resolve(POB_DIR, f)).size; } catch {}
}
for (const f of deferred) {
  try { deferredSize += statSync(resolve(POB_DIR, f)).size; } catch {}
}

writeFileSync(ESSENTIAL_OUT, JSON.stringify(essential));
writeFileSync(DEFERRED_OUT, JSON.stringify(deferred));

console.log(`Essential: ${essential.length} files (${(essentialSize / 1024 / 1024).toFixed(1)} MB)`);
console.log(`Deferred:  ${deferred.length} files (${(deferredSize / 1024 / 1024).toFixed(1)} MB)`);
console.log(`Total:     ${files.length} files`);
