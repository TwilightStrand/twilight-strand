import type { EngineRequest, EngineResponse, BuildStats, ItemData, SkillGroup, GemData } from "./types";
import { Zip } from "@zenfs/archives";
import * as zenfs from "@zenfs/core";

let initialized = false;

interface DriverModule extends EmscriptenModule {
  cwrap: typeof cwrap;
  fs: typeof zenfs.fs;
}

interface DriverImports {
  mountFs: () => number;
  init: () => number;
  start: () => number;
  onFrame: () => number;
  loadBuildFromCode: (code: string) => number;
  doString: (code: string) => number;
  setGlobalString: (name: string, value: string) => number;
  getGlobalToPrint: (name: string) => number;
}

let driverModule: DriverModule | null = null;
let imports: DriverImports | null = null;
let printCapture: string | null = null;

function reply(msg: EngineResponse): void {
  postMessage(msg);
}

function progress(id: number, stage: string): void {
  reply({ id, type: "progress", stage });
}

async function captureGlobal(name: string): Promise<string> {
  printCapture = "";
  await imports!.doString(`print(${name})`);
  const result = printCapture;
  printCapture = null;
  return result;
}

async function handleInit(id: number, _gameId: string): Promise<void> {
  try {
    progress(id, "Fetching root.zip...");
    const rootZipResp = await fetch("/data/pob/root.zip");
    if (!rootZipResp.ok) throw new Error(`Failed to fetch root.zip: ${rootZipResp.status}`);
    const rootZipData = await rootZipResp.arrayBuffer();

    progress(id, "Configuring filesystem...");
    await zenfs.configure({
      mounts: {
        "/root": {
          backend: Zip,
          data: rootZipData,
          name: "root.zip",
        },
        "/lib/lua": { backend: zenfs.InMemory },
        "/user": { backend: zenfs.InMemory },
      },
    });

    // Mount lua-utf8 C extension
    const utf8Resp = await fetch("/data/pob/driver/lua-utf8.wasm");
    if (utf8Resp.ok) {
      const utf8Data = new Uint8Array(await utf8Resp.arrayBuffer());
      zenfs.fs.writeFileSync("/lib/lua/lua-utf8.wasm", utf8Data);
    }

    // Create user directories PoB expects
    try { zenfs.fs.mkdirSync("/user/Path of Building", { recursive: true }); } catch {}
    try { zenfs.fs.mkdirSync("/user/Path of Building/Builds", { recursive: true }); } catch {}

    // The compiled WASM driver tries to open .image.tsv on startup
    try { zenfs.fs.writeFileSync("/root/.image.tsv", ""); } catch {}

    progress(id, "Loading WASM driver...");
    const driverFactory = (await import("/data/pob/driver/driver.mjs")).default as (
      opts: Record<string, unknown>
    ) => Promise<DriverModule>;

    const module = await driverFactory({
      print: (text: string) => {
        if (printCapture !== null) {
          printCapture += text;
        } else {
          console.log("[lua]", text);
        }
      },
      printErr: (text: string) => console.warn("[lua-err]", text),
    });

    // Assign headless stubs - the C driver calls these via EM_ASM
    Object.assign(module, {
      fs: zenfs.fs,
      onError: (msg: string) => console.error("[pob-error]", msg),
      setWindowTitle: (_title: string) => {},
      getScreenWidth: () => 1920,
      getScreenHeight: () => 1080,
      getCursorPosX: () => 0,
      getCursorPosY: () => 0,
      isKeyDown: (_name: string) => false,
      copy: (_text: string) => {},
      paste: () => Promise.resolve(""),
      openUrl: (_url: string) => {},
      imageLoad: (_handle: number, _filename: string, _flags: number) => {},
      drawCommit: (_bufferPtr: number, _size: number) => {},
      getStringWidth: (_size: number, _font: number, _text: string) => 0,
      getStringCursorIndex: () => 0,
      fetch: (_url: string, _header: string, _body: string) => {},
      launchSubScript: () => 0,
      abortSubScript: () => {},
      isSubScriptRunning: () => false,
    });

    driverModule = module;

    // Resolve C exports
    const im: DriverImports = {
      mountFs: module.cwrap("mount_fs", "number", [], { async: true }),
      init: module.cwrap("init", "number", [], { async: true }),
      start: module.cwrap("start", "number", [], { async: true }),
      onFrame: module.cwrap("on_frame", "number", [], { async: true }),
      loadBuildFromCode: module.cwrap("load_build_from_code", "number", ["string"], { async: true }),
      doString: module.cwrap("do_string", "number", ["string"], { async: true }),
      setGlobalString: module.cwrap("set_global_string", "number", ["string", "string"]),
      getGlobalToPrint: module.cwrap("get_global_to_print", "number", ["string"]),
    };
    imports = im;

    progress(id, "Mounting filesystem...");
    const mountResult = await im.mountFs();
    if (mountResult !== 0) throw new Error(`mount_fs failed: ${mountResult}`);

    progress(id, "Initializing Lua VM...");
    const initResult = await im.init();
    if (initResult !== 0) throw new Error(`init failed: ${initResult}`);

    // Our root.zip has runtime modules at runtime/*.lua instead of lua/*.lua
    // (pob-web's packer remaps them). Add the runtime path so require("xml") works.
    await im.doString(`package.path = package.path .. ";/app/root/runtime/?.lua;/app/root/runtime/?/init.lua"`);

    progress(id, "Booting PoB (Launch.lua + OnInit + OnFrame)...");
    const startResult = await im.start();
    if (startResult !== 0) throw new Error(`start failed: ${startResult}`);

    // Run a few extra frames to let PoB settle
    for (let i = 0; i < 3; i++) {
      await im.onFrame();
    }

    // Inject JSON encoder (dkjson.encode broken in Lua 5.2 due to _ENV=nil + table.sort)
    await im.doString(JSON_BUILDER_LUA);

    progress(id, "PoB ready");
    initialized = true;
    reply({ id, type: "ready" });
  } catch (e) {
    reply({
      id,
      type: "error",
      message: `Init failed: ${e instanceof Error ? e.message : String(e)}`,
    });
  }
}

// Shared JSON builder injected once into Lua state during init
const JSON_BUILDER_LUA = `
function _tsc_json_encode(val, depth)
  depth = depth or 0
  if depth > 20 then return '"[max depth]"' end
  local t = type(val)
  if val == nil then return "null"
  elseif t == "boolean" then return val and "true" or "false"
  elseif t == "number" then
    if val ~= val then return "null" end
    if val == math.huge or val == -math.huge then return "null" end
    return string.format("%.10g", val)
  elseif t == "string" then
    return '"' .. val:gsub('\\\\', '\\\\\\\\'):gsub('"', '\\\\"'):gsub('%c', function(c)
      return string.format('\\\\u%04x', string.byte(c))
    end) .. '"'
  elseif t == "table" then
    local is_array = #val > 0 or next(val) == nil
    if is_array then
      local parts = {}
      for i = 1, #val do parts[i] = _tsc_json_encode(val[i], depth+1) end
      return "[" .. table.concat(parts, ",") .. "]"
    else
      local parts = {}
      for k, v in pairs(val) do
        if type(k) == "string" or type(k) == "number" then
          parts[#parts+1] = _tsc_json_encode(tostring(k), depth+1) .. ":" .. _tsc_json_encode(v, depth+1)
        end
      end
      return "{" .. table.concat(parts, ",") .. "}"
    end
  end
  return "null"
end
`;

const EXTRACT_STATS_LUA = `
local ok, err = pcall(function()
local mainObject = GetMainObject()
local b = mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"]

local result = {}
if not b then
  result._error = "No build object"
else
  result.class_name = b.className or (b.spec and b.spec.curClassName) or "?"
  result.ascendancy = b.ascendClassName or (b.spec and b.spec.curAscendClassName) or ""
  result.level = b.characterLevel or 1

  result.allocated_nodes = {}
  if b.spec and b.spec.allocNodes then
    local i = 1
    for nodeId in pairs(b.spec.allocNodes) do
      result.allocated_nodes[i] = nodeId
      i = i + 1
    end
  end

  if b.calcsTab and b.calcsTab.mainOutput then
    local out = b.calcsTab.mainOutput
    result.total_dps = out.TotalDPS or out.CombinedDPS or 0
    result.combined_dps = out.CombinedDPS or out.TotalDPS or 0
    result.full_dps = out.FullDPS or 0
    result.total_ehp = out.TotalEHP or 0
    result.life = out.Life or 0
    result.energy_shield = out.EnergyShield or 0
    result.mana = out.Mana or 0
    result.strength = out.Str or 0
    result.dexterity = out.Dex or 0
    result.intelligence = out.Int or 0
    result.armour = out.Armour or 0
    result.evasion = out.Evasion or 0
    result.evade_chance = out.EvadeChance or 0
    result.block_chance = out.BlockChance or 0
    result.spell_block = out.SpellBlockChance or 0
    result.suppression = out.SpellSuppressionChance or 0
    result.phys_reduction = out.PhysicalDamageReduction or 0
    result.fire_res = out.FireResist or 0
    result.cold_res = out.ColdResist or 0
    result.lightning_res = out.LightningResist or 0
    result.chaos_res = out.ChaosResist or 0
    result.fire_res_max = out.FireResistMax or 75
    result.cold_res_max = out.ColdResistMax or 75
    result.lightning_res_max = out.LightningResistMax or 75
    result.chaos_res_max = out.ChaosResistMax or 75
    result.crit_chance = out.CritChance or 0
    result.crit_multiplier = (out.CritMultiplier or 1.5) * 100
    result.attack_speed = out.Speed or 0
    result.hit_chance = out.HitChance or 0
    result.accuracy = out.Accuracy or 0
    result.life_regen = out.LifeRegen or 0
    result.mana_regen = out.ManaRegen or 0
    result.mana_unreserved = out.ManaUnreserved or out.Mana or 0
    result.life_unreserved = out.LifeUnreserved or out.Life or 0
    result.mana_reserved_percent = out.ManaReservedPercent or 0
    result.ward = out.Ward or 0
    result.total_dps_with_minions = out.TotalDPSWithMinions or out.TotalDPS or 0
    result.bleed_dps = out.BleedDPS or 0
    result.poison_dps = out.PoisonDPS or 0
    result.ignite_dps = out.IgniteDPS or 0
    result.impale_dps = out.ImpaleDPS or 0
    result.life_leech_rate = out.LifeLeechGainRate or 0
    result.es_leech_rate = out.EnergyShieldLeechGainRate or 0
    result.es_regen = out.EnergyShieldRegen or 0
    result.es_recharge_rate = out.EnergyShieldRecharge or 0
    result.main_socket_group = b.mainSocketGroup or 0
    result.tree_version = b.spec and b.spec.treeVersion or "3_29"
    result.has_calcs = true
  else
    result.has_calcs = false
  end
end

_tsc_result = _tsc_json_encode(result)
end)
if not ok then _tsc_extract_error = tostring(err) end
`;

const EXTRACT_ITEMS_LUA = `
local mainObject = GetMainObject()
local b = mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"]
local items = {}
if b and b.itemsTab and b.itemsTab.items then
  local idx = 1
  for _, item in pairs(b.itemsTab.items) do
    if item.name and item.name ~= "" then
      local mods = {}
      if item.explicitModLines then
        for _, modLine in ipairs(item.explicitModLines) do
          if modLine.line and modLine.line ~= "" then
            mods[#mods+1] = modLine.line
          end
        end
      end
      items[idx] = {
        slot = item.slotName or "",
        name = item.name or "",
        base = item.baseName or item.base or "",
        rarity = item.rarity or "Normal",
        mods = mods,
        quality = item.quality or 0,
        sockets = "",
      }
      idx = idx + 1
    end
  end
end
_tsc_result = _tsc_json_encode(items)
`;

const EXTRACT_SKILLS_LUA = `
local mainObject = GetMainObject()
local b = mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"]
local skills = {}
if b and b.skillsTab and b.skillsTab.socketGroupList then
  for i, group in ipairs(b.skillsTab.socketGroupList) do
    local gems = {}
    if group.gemList then
      for j, gem in ipairs(group.gemList) do
        gems[j] = {
          name = gem.nameSpec or gem.name or "",
          level = gem.level or 20,
          quality = gem.quality or 0,
          enabled = gem.enabled ~= false,
          skillId = gem.skillId or gem.gemId or "",
          isSupport = gem.grantedEffect and gem.grantedEffect.support == true or false,
        }
      end
    end
    local groupDps = 0
    if group.displaySkillList and group.mainActiveSkill then
      local activeSkill = group.displaySkillList[group.mainActiveSkill]
      if activeSkill and activeSkill.output then
        groupDps = activeSkill.output.TotalDPS or activeSkill.output.CombinedDPS or 0
      end
    end
    skills[i] = {
      slot = group.slot or "",
      enabled = group.enabled ~= false,
      gems = gems,
      label = group.displayLabel or group.slot or "Group " .. i,
      dps = groupDps,
    }
  end
end
_tsc_result = _tsc_json_encode(skills)
`;

async function handleEvaluate(
  id: number,
  xml: string,
  config?: Record<string, string | boolean | number>
): Promise<void> {
  if (!initialized || !imports) {
    reply({ id, type: "error", message: "Engine not initialized" });
    return;
  }

  try {
    // Detect if input is a PoB paste code (base64url) or raw XML
    const isXml = xml.trimStart().startsWith("<?xml") || xml.trimStart().startsWith("<PathOfBuilding");

    if (isXml) {
      progress(id, "Loading build XML...");
      imports.setGlobalString("_tsc_build_xml", xml);
      await imports.doString(`
        local mainObject = GetMainObject()
        mainObject.main:SetMode("BUILD", false, "imported", _tsc_build_xml)
        _tsc_build_xml = nil
      `);
    } else {
      progress(id, "Loading build from code...");
      const result = await imports.loadBuildFromCode(xml);
      if (result !== 0) {
        throw new Error(`loadBuildFromCode failed: ${result}`);
      }
    }

    progress(id, "Running calculations...");
    // Initial frames to process the build loading
    for (let i = 0; i < 50; i++) {
      await imports.onFrame();
    }

    // Force full recalc: rebuild config mod list, set buildFlag, run more frames
    await imports.doString(`
      local mainObject = GetMainObject()
      local b = mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"]
      if b then
        if b.configTab then pcall(function() b.configTab:BuildModList() end) end
        if b.itemsTab then pcall(function() b.itemsTab:PopulateSlots() end) end
        b.buildFlag = true
      end
    `);
    for (let i = 0; i < 100; i++) {
      await imports.onFrame();
    }

    // Apply config overrides if any
    if (config && Object.keys(config).length > 0) {
      imports.setGlobalString("_tsc_config_json", JSON.stringify(config));
      await imports.doString(`
        local dkjson = require("dkjson")
        local config = dkjson.decode(_tsc_config_json)
        _tsc_config_json = nil
        local mainObject = GetMainObject()
        local b = mainObject.main.modes and mainObject.main.modes["BUILD"]
        if b and b.configTab and b.configTab.input then
          for k, v in pairs(config) do
            b.configTab.input[k] = v
          end
          pcall(function() b.configTab:BuildModList() end)
          b.buildFlag = true
        end
      `);
      // More frames for config to take effect
      for (let i = 0; i < 20; i++) {
        await imports.onFrame();
      }
    }

    progress(id, "Extracting stats...");

    // Reset before extraction
    await imports.doString(`_tsc_result = nil; _tsc_extract_error = nil`);
    await imports.doString(EXTRACT_STATS_LUA);

    const statsJson = await captureGlobal("_tsc_result");
    if (!statsJson || statsJson === "nil") {
      const errCapture = await captureGlobal("_tsc_extract_error");
      throw new Error(`Stats extraction failed: ${errCapture || "unknown"}`);
    }
    const rawStats = JSON.parse(statsJson);

    if (rawStats._error) {
      console.warn("[evaluate]", rawStats._error);
    }

    const stats: BuildStats = {
      total_dps: rawStats.total_dps ?? 0,
      combined_dps: rawStats.combined_dps ?? 0,
      full_dps: rawStats.full_dps ?? 0,
      total_ehp: rawStats.total_ehp ?? 0,
      life: rawStats.life ?? 60,
      energy_shield: rawStats.energy_shield ?? 0,
      mana: rawStats.mana ?? 50,
      strength: rawStats.strength ?? 20,
      dexterity: rawStats.dexterity ?? 20,
      intelligence: rawStats.intelligence ?? 20,
      armour: rawStats.armour ?? 0,
      evasion: rawStats.evasion ?? 16,
      evade_chance: rawStats.evade_chance ?? 0,
      block_chance: rawStats.block_chance ?? 0,
      spell_block: rawStats.spell_block ?? 0,
      suppression: rawStats.suppression ?? 0,
      phys_reduction: rawStats.phys_reduction ?? 0,
      fire_res: rawStats.fire_res ?? -60,
      cold_res: rawStats.cold_res ?? -60,
      lightning_res: rawStats.lightning_res ?? -60,
      chaos_res: rawStats.chaos_res ?? -60,
      fire_res_max: rawStats.fire_res_max ?? 75,
      cold_res_max: rawStats.cold_res_max ?? 75,
      lightning_res_max: rawStats.lightning_res_max ?? 75,
      chaos_res_max: rawStats.chaos_res_max ?? 75,
      life_regen: rawStats.life_regen ?? 0,
      mana_regen: rawStats.mana_regen ?? 0.9,
      mana_unreserved: rawStats.mana_unreserved ?? 50,
      life_unreserved: rawStats.life_unreserved ?? 60,
      mana_reserved_percent: rawStats.mana_reserved_percent ?? 0,
      crit_chance: rawStats.crit_chance ?? 0,
      crit_multiplier: rawStats.crit_multiplier ?? 150,
      attack_speed: rawStats.attack_speed ?? 1.2,
      hit_chance: rawStats.hit_chance ?? 5,
      accuracy: rawStats.accuracy ?? 40,
      ward: rawStats.ward ?? 0,
      total_dps_with_minions: rawStats.total_dps_with_minions ?? 0,
      bleed_dps: rawStats.bleed_dps ?? 0,
      poison_dps: rawStats.poison_dps ?? 0,
      ignite_dps: rawStats.ignite_dps ?? 0,
      impale_dps: rawStats.impale_dps ?? 0,
      life_leech_rate: rawStats.life_leech_rate ?? 0,
      es_leech_rate: rawStats.es_leech_rate ?? 0,
      es_regen: rawStats.es_regen ?? 0,
      es_recharge_rate: rawStats.es_recharge_rate ?? 0,
      class_name: rawStats.class_name ?? "Scion",
      ascendancy: rawStats.ascendancy ?? "",
      level: rawStats.level ?? 1,
      allocated_nodes: rawStats.allocated_nodes
        ? Object.values(rawStats.allocated_nodes as Record<string, number>).map(Number)
        : [],
      main_socket_group: rawStats.main_socket_group ?? 0,
      tree_version: rawStats.tree_version ?? "3_29",
    };

    // Extract items
    await imports.doString(EXTRACT_ITEMS_LUA);
    const itemsJson = await captureGlobal("_tsc_result");
    const rawItems = JSON.parse(itemsJson) as Record<string, Record<string, unknown>>;
    const items: ItemData[] = [];
    for (const item of Object.values(rawItems)) {
      if (item && typeof item === "object") {
        const mods: string[] = [];
        if (item.mods && typeof item.mods === "object") {
          for (const mod of Object.values(item.mods as Record<string, string>)) {
            if (typeof mod === "string" && mod) mods.push(mod);
          }
        }
        items.push({
          slot: String(item.slot ?? ""),
          name: String(item.name ?? ""),
          base: String(item.base ?? ""),
          rarity: String(item.rarity ?? "Normal"),
          mods,
          quality: Number(item.quality ?? 0),
          sockets: String(item.sockets ?? ""),
        });
      }
    }

    // Extract skills
    await imports.doString(EXTRACT_SKILLS_LUA);
    const skillsJson = await captureGlobal("_tsc_result");
    const rawSkills = JSON.parse(skillsJson) as Record<string, Record<string, unknown>>;
    const skills: SkillGroup[] = [];
    for (const group of Object.values(rawSkills)) {
      if (group && typeof group === "object") {
        const gems: GemData[] = [];
        if (group.gems && typeof group.gems === "object") {
          for (const gem of Object.values(group.gems as Record<string, Record<string, unknown>>)) {
            if (gem && typeof gem === "object") {
              gems.push({
                name: String(gem.name ?? ""),
                level: Number(gem.level ?? 20),
                quality: Number(gem.quality ?? 0),
                enabled: gem.enabled !== false,
                skillId: String(gem.skillId ?? ""),
                isSupport: gem.isSupport === true,
              });
            }
          }
        }
        skills.push({
          slot: String(group.slot ?? ""),
          enabled: group.enabled !== false,
          gems,
          label: String(group.label ?? ""),
          dps: typeof group.dps === "number" ? group.dps : undefined,
        });
      }
    }

    reply({ id, type: "evaluated", stats, items, skills });
  } catch (e) {
    reply({
      id,
      type: "error",
      message: `Evaluate failed: ${e instanceof Error ? e.message : String(e)}`,
    });
  }
}

self.onmessage = async (e: MessageEvent<EngineRequest>) => {
  const msg = e.data;

  switch (msg.type) {
    case "init":
      await handleInit(msg.id, msg.gameId);
      break;
    case "evaluate":
      await handleEvaluate(
        msg.id,
        msg.xml,
        (msg as { config?: Record<string, string | boolean | number> }).config
      );
      break;
    case "ping":
      reply({ id: msg.id, type: "pong" });
      break;
    default: {
      const unknown = msg as { id: number; type: string };
      reply({
        id: unknown.id,
        type: "error",
        message: `Unknown message type: ${unknown.type}`,
      });
    }
  }
};
