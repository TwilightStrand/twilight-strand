#!/usr/bin/env node
/**
 * Converts PoB tree.lua and sprites.lua files from Lua table literals to JSON.
 * The Lua format is regular enough for a simple text transform:
 *   ["key"]= value  →  "key": value
 *   { ... }         →  [ ... ] for integer-keyed arrays
 *
 * Usage: node scripts/convert-tree-lua.mjs [version]
 * Default version: 3_29
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const treeDataDir = resolve(__dirname, "../public/data/pob/TreeData");

const version = process.argv[2] || "3_29";

function luaTableToJson(luaText) {
  // Strip the leading "return " if present
  let text = luaText.trim();
  if (text.startsWith("return ")) {
    text = text.slice(7);
  }

  // Tokenize and convert
  let pos = 0;

  function skipWhitespace() {
    while (pos < text.length && /\s/.test(text[pos])) pos++;
    // Skip Lua comments
    if (text[pos] === "-" && text[pos + 1] === "-") {
      if (text[pos + 2] === "[" && text[pos + 3] === "[") {
        // Long comment --[[ ... ]]
        const end = text.indexOf("]]", pos + 4);
        pos = end === -1 ? text.length : end + 2;
      } else {
        // Line comment
        while (pos < text.length && text[pos] !== "\n") pos++;
      }
      skipWhitespace();
    }
  }

  function parseValue() {
    skipWhitespace();
    const ch = text[pos];

    if (ch === "{") return parseTable();
    if (ch === '"') return parseString();
    if (ch === "'") return parseSingleQuoteString();
    if (ch === "-" || (ch >= "0" && ch <= "9")) return parseNumber();
    if (text.startsWith("true", pos)) { pos += 4; return true; }
    if (text.startsWith("false", pos)) { pos += 5; return false; }
    if (text.startsWith("nil", pos)) { pos += 3; return null; }

    throw new Error(`Unexpected character '${ch}' at position ${pos}: ...${text.slice(pos, pos + 30)}...`);
  }

  function parseString() {
    pos++; // skip opening "
    let result = "";
    while (pos < text.length && text[pos] !== '"') {
      if (text[pos] === "\\") {
        pos++;
        const esc = text[pos];
        if (esc === "n") result += "\n";
        else if (esc === "t") result += "\t";
        else if (esc === "\\") result += "\\";
        else if (esc === '"') result += '"';
        else if (esc === "'") result += "'";
        else if (esc === "\n" || esc === "\r") {
          result += "\n";
          if (esc === "\r" && text[pos + 1] === "\n") pos++;
        }
        else if (esc >= "0" && esc <= "9") {
          // Numeric escape \ddd
          let num = esc;
          if (text[pos + 1] >= "0" && text[pos + 1] <= "9") { pos++; num += text[pos]; }
          if (text[pos + 1] >= "0" && text[pos + 1] <= "9") { pos++; num += text[pos]; }
          result += String.fromCharCode(parseInt(num, 10));
        }
        else result += esc;
        pos++;
      } else {
        result += text[pos];
        pos++;
      }
    }
    pos++; // skip closing "
    return result;
  }

  function parseSingleQuoteString() {
    pos++; // skip opening '
    let result = "";
    while (pos < text.length && text[pos] !== "'") {
      if (text[pos] === "\\") {
        pos++;
        result += text[pos];
        pos++;
      } else {
        result += text[pos];
        pos++;
      }
    }
    pos++; // skip closing '
    return result;
  }

  function parseNumber() {
    const start = pos;
    if (text[pos] === "-") pos++;
    if (text[pos] === "0" && (text[pos + 1] === "x" || text[pos + 1] === "X")) {
      pos += 2;
      while (pos < text.length && /[0-9a-fA-F]/.test(text[pos])) pos++;
      return parseInt(text.slice(start, pos));
    }
    while (pos < text.length && (text[pos] >= "0" && text[pos] <= "9")) pos++;
    if (text[pos] === ".") {
      pos++;
      while (pos < text.length && (text[pos] >= "0" && text[pos] <= "9")) pos++;
    }
    if (text[pos] === "e" || text[pos] === "E") {
      pos++;
      if (text[pos] === "+" || text[pos] === "-") pos++;
      while (pos < text.length && (text[pos] >= "0" && text[pos] <= "9")) pos++;
    }
    return Number(text.slice(start, pos));
  }

  function parseTable() {
    pos++; // skip {
    skipWhitespace();

    if (text[pos] === "}") { pos++; return []; }

    // Peek to determine if this is an array or object
    const savedPos = pos;
    const isArray = !text.startsWith('["', pos) && !isIdentifierKey();

    pos = savedPos;

    if (isArray) {
      return parseArray();
    } else {
      return parseObject();
    }
  }

  function isIdentifierKey() {
    // Check if current position starts with: identifier =
    const saved = pos;
    if (/[a-zA-Z_]/.test(text[pos])) {
      while (pos < text.length && /[a-zA-Z0-9_]/.test(text[pos])) pos++;
      skipWhitespace();
      if (text[pos] === "=") {
        pos = saved;
        return true;
      }
    }
    pos = saved;
    return false;
  }

  function parseArray() {
    const arr = [];
    while (pos < text.length) {
      skipWhitespace();
      if (text[pos] === "}") { pos++; return arr; }

      // Handle [index]= value syntax in arrays
      if (text[pos] === "[") {
        const saved = pos;
        pos++;
        skipWhitespace();
        // Could be [number]= or ["string"]=
        if (text[pos] >= "0" && text[pos] <= "9") {
          const idx = parseNumber();
          skipWhitespace();
          if (text[pos] === "]") {
            pos++;
            skipWhitespace();
            if (text[pos] === "=") {
              pos++;
              skipWhitespace();
              const val = parseValue();
              // Lua arrays are 1-indexed
              arr[idx - 1] = val;
              skipWhitespace();
              if (text[pos] === ",") pos++;
              continue;
            }
          }
        }
        pos = saved;
      }

      const val = parseValue();
      arr.push(val);
      skipWhitespace();
      if (text[pos] === ",") pos++;
    }
    return arr;
  }

  function parseObject() {
    const obj = {};
    while (pos < text.length) {
      skipWhitespace();
      if (text[pos] === "}") { pos++; return obj; }

      let key;
      if (text[pos] === "[") {
        pos++; // skip [
        skipWhitespace();
        if (text[pos] === '"') {
          key = parseString();
        } else {
          // Numeric key
          key = String(parseNumber());
        }
        skipWhitespace();
        pos++; // skip ]
      } else {
        // Bare identifier key
        const start = pos;
        while (pos < text.length && /[a-zA-Z0-9_]/.test(text[pos])) pos++;
        key = text.slice(start, pos);
      }

      skipWhitespace();
      pos++; // skip =
      skipWhitespace();

      obj[key] = parseValue();
      skipWhitespace();
      if (text[pos] === ",") pos++;
    }
    return obj;
  }

  return parseValue();
}

function convertFile(filename) {
  const luaPath = resolve(treeDataDir, version, filename);
  const jsonPath = luaPath.replace(/\.lua$/, ".json");

  if (!existsSync(luaPath)) {
    console.log(`  Skipping ${filename} (not found)`);
    return;
  }

  const luaText = readFileSync(luaPath, "utf-8");
  const start = performance.now();
  const data = luaTableToJson(luaText);
  const parseTime = (performance.now() - start).toFixed(0);

  const json = JSON.stringify(data);
  writeFileSync(jsonPath, json);

  const luaSize = (luaText.length / 1024).toFixed(0);
  const jsonSize = (json.length / 1024).toFixed(0);
  console.log(`  ${filename}: ${luaSize}KB lua → ${jsonSize}KB json (parsed in ${parseTime}ms)`);
}

console.log(`Converting tree data for version ${version}...`);
convertFile("tree.lua");
convertFile("sprites.lua");
console.log("Done.");
