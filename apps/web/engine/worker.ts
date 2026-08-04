import type { EngineRequest, EngineResponse, BuildStats } from "./types";

let factory: import("wasmoon").default | null = null;
let lua: Awaited<ReturnType<import("wasmoon").default["createEngine"]>> | null = null;
let initialized = false;

function reply(msg: EngineResponse): void {
  postMessage(msg);
}

function progress(id: number, stage: string): void {
  reply({ id, type: "progress", stage });
}

const LUA_SHIMS = `
  -- Rendering stubs (PoB desktop rendering API)
  function SetDrawLayer(l, s) end
  function SetDrawColor(r, g, b, a) end
  function DrawImage(h, x, y, w, hh, ...) end
  function DrawImageQuad(h, ...) end
  function DrawString(x, y, a, h, f, t) end
  function DrawStringWidth(h, f, t) return 0 end
  function DrawStringCursorIndex(h, f, t, cx, cy) return 0 end
  function NewImageHandle() return { Load = function() end, SetLoadingPriority = function() end, ImageSize = function() return 0, 0 end } end
  function StripEscapes(t) return t end
  function GetScreenSize() return 1920, 1080 end
  function SetCursorPos(x, y) end
  function GetCursorPos() return 0, 0 end
  function ShowCursor(s) end
  function IsKeyDown(k) return false end
  function Copy(t) end
  function Paste() return "" end
  function GetTime() return 0 end
  function SetWindowTitle(t) end
  function RenderInit() end
  function SetViewport(x, y, w, h) end
  function SetDrawSubShader(h, s) end
  function GetAsyncCount() return 0 end
  function IsUserScriptReady() return true end
  function GetVirtualScreenSize() return 1920, 1080 end
  function GetResourceCount() return 0 end
  function GetPendingFileCount() return 0 end

  -- Filesystem stubs
  function GetScriptPath() return "/pob" end
  function GetRuntimePath() return "/pobrt" end
  function GetUserPath() return "/user" end
  function MakeDir(p) end
  function RemoveDir(p) end
  function SetWorkDir(p) end
  function GetWorkDir() return "" end

  -- Subprocess stubs
  function LaunchSubScript(...) end
  function AbortSubScript(id) end
  function IsSubScriptRunning(id) return false end

  -- System stubs
  function SpawnProcess(c, a) end
  function OpenURL(u) end
  function SetProfiling(e) end
  function Restart() end
  function Exit() end
  function TakeScreenshot() end
  function GetCloudProvider(p) return nil, nil, nil end

  -- File search stubs
  function NewFileSearch(path, findDirectories)
    return nil
  end

  -- Inflate/Deflate stubs
  Inflate = function(d) return "" end
  Deflate = function(d) return "" end

  -- Module loading
  function LoadModule(fn, ...)
    if not fn:match("%.lua") then fn = fn .. ".lua" end
    local f, e = loadfile(fn)
    if f then return f(...) else error("LoadModule() error loading '"..fn.."': "..tostring(e)) end
  end

  function PLoadModule(fn, ...)
    if not fn:match("%.lua") then fn = fn .. ".lua" end
    local f, e = loadfile(fn)
    if f then return PCall(f, ...) else error("PLoadModule() error loading '"..fn.."': "..tostring(e)) end
  end

  function PCall(fn, ...)
    local r = {pcall(fn, ...)}
    if r[1] then table.remove(r, 1); return nil, unpack(r) else return r[2] end
  end

  function ConPrintf(fmt, ...)
    -- silent in browser
  end
  function ConPrintTable(t, n) end
  function ConExecute(c) end
  function ConClear() end

  -- Override require for missing modules
  local _orig_require = require
  function require(name)
    if name == "lcurl.safe" then return nil end
    -- lua-utf8 is a C extension in desktop PoB; provide a minimal shim
    if name == "lua-utf8" then
      return {
        byte = string.byte,
        char = utf8.char,
        len = utf8.len,
        sub = string.sub,
        find = string.find,
        gmatch = string.gmatch,
        gsub = string.gsub,
        match = string.match,
        lower = string.lower,
        upper = string.upper,
        rep = string.rep,
        reverse = string.reverse,
        format = string.format,
        charpattern = utf8.charpattern,
      }
    end
    return _orig_require(name)
  end

  -- PoB-specific stubs
  mainObject = nil
  function SetMainObject(obj) mainObject = obj end
  function GetMainObject() return mainObject end

  -- Callback system (from PoB's runtime)
  local callbacks = {}
  function SetCallback(name) callbacks[name] = true end
  function runCallback(name, ...)
    if mainObject and mainObject[name] then
      return mainObject[name](mainObject, ...)
    end
  end

  -- JIT stub (wasmoon uses PUC Lua, not LuaJIT)
  jit = { opt = { start = function() end }, version = "disabled" }

  -- Lua 5.3/5.4 compatibility: unpack was moved to table.unpack
  if not unpack then unpack = table.unpack end
  if not table.unpack then table.unpack = unpack end

  -- LuaJIT gsub compat: LuaJIT silently allows %X in replacement strings
  -- where X is not a digit or %. PUC Lua 5.4 raises "invalid use of '%'".
  -- PoB's TradeHelpers.lua relies on this lenient behavior.
  do
    local _orig_gsub = string.gsub
    local function sanitize_repl(repl)
      local out = {}
      local i = 1
      local len = #repl
      while i <= len do
        local c = repl:sub(i, i)
        if c == "%" and i < len then
          local nc = repl:sub(i+1, i+1)
          if nc == "%" or (nc >= "0" and nc <= "9") then
            out[#out+1] = c
            out[#out+1] = nc
            i = i + 2
          else
            out[#out+1] = nc
            i = i + 2
          end
        else
          out[#out+1] = c
          i = i + 1
        end
      end
      return table.concat(out)
    end
    string.gsub = function(s, pattern, repl, ...)
      if type(repl) == "string" then
        return _orig_gsub(s, pattern, sanitize_repl(repl), ...)
      end
      return _orig_gsub(s, pattern, repl, ...)
    end
  end

  -- Lua 5.4 string.format %d compat: LuaJIT silently truncates floats
  -- for %d, but PUC Lua 5.4 raises "number has no integer representation".
  -- PoB's calc modules pass floats to %d throughout.
  do
    local _orig_format = string.format
    local floor = math.floor
    string.format = function(fmt, ...)
      if type(fmt) ~= "string" then
        return _orig_format(fmt, ...)
      end
      local nargs = select("#", ...)
      if nargs == 0 then return _orig_format(fmt) end
      local args = {...}
      local i = 0
      local pos = 1
      while pos <= #fmt do
        local c = fmt:sub(pos, pos)
        if c == "%" then
          local next_c = fmt:sub(pos+1, pos+1)
          if next_c == "%" then
            pos = pos + 2
          else
            i = i + 1
            local _, endpos = fmt:find("^%%[-#+ 0]*%d*%.?%d*[a-zA-Z]", pos)
            if endpos then
              local spec = fmt:sub(endpos, endpos)
              if (spec == "d" or spec == "i" or spec == "o" or spec == "u" or spec == "x" or spec == "X") and i <= nargs and type(args[i]) == "number" then
                args[i] = floor(args[i])
              end
              pos = endpos + 1
            else
              pos = pos + 1
            end
          end
        else
          pos = pos + 1
        end
      end
      return _orig_format(fmt, unpack(args, 1, nargs))
    end
  end

  -- Command-line args stub (PoB's Main.lua reads arg[0])
  arg = arg or { [0] = "/pob/Launch.lua" }

  -- Lua 5.1/LuaJIT compat: loadstring was renamed to load in 5.2+
  if not loadstring then loadstring = load end

  -- Bit operations compatibility
  -- PoB expects LuaJIT's 'bit' library; PUC Lua 5.4 uses native operators
  bit = {
    band = function(a, b) return a & b end,
    bor = function(a, b) return a | b end,
    bxor = function(a, b) return a ~ b end,
    bnot = function(a) return ~a end,
    lshift = function(a, b) return a << b end,
    rshift = function(a, b) return a >> b end,
    arshift = function(a, b) return a >> b end,
    tobit = function(a) return a & 0xFFFFFFFF end,
    tohex = function(a, n) return string.format("%0" .. (n or 8) .. "x", a & 0xFFFFFFFF) end,
    bswap = function(a)
      a = a & 0xFFFFFFFF
      return ((a & 0xFF) << 24) | ((a & 0xFF00) << 8) | ((a >> 8) & 0xFF00) | ((a >> 24) & 0xFF)
    end,
    rol = function(a, b) a = a & 0xFFFFFFFF; return ((a << b) | (a >> (32 - b))) & 0xFFFFFFFF end,
    ror = function(a, b) a = a & 0xFFFFFFFF; return ((a >> b) | (a << (32 - b))) & 0xFFFFFFFF end,
  }
  bit32 = bit

  -- Files that don't exist in browser - return empty stubs
  _tsc_missing_files = {
    ["UpdateCheck.lua"] = true,
    ["UpdateApply.lua"] = true,
    ["LaunchInstall.lua"] = true,
    ["first.run"] = true,
    ["manifest.xml"] = true,
  }

  -- I/O stubs for PoB file operations
  local _orig_io_open = io.open
  io.open = function(path, mode)
    if mode and mode:match("w") then return nil, "read-only filesystem" end
    -- Block known missing files to avoid errors in update/install code
    local basename = path:match("([^/]+)$") or path
    if _tsc_missing_files[basename] then return nil, "file not available in browser" end
    -- Try /pob/ prefix for relative paths
    local f, e = _orig_io_open(path, mode)
    if f then return f, e end
    if not path:match("^/") then
      f, e = _orig_io_open("/pob/" .. path, mode)
      if f then return f, e end
    end
    return nil, e
  end
`;

async function fetchAndMountFiles(
  f: import("wasmoon").default,
  baseUrl: string
): Promise<number> {
  // Fetch the file manifest (generated by gen-manifest.sh)
  const listResp = await fetch(`${baseUrl}/file-list.json?v=${Date.now()}`);
  if (!listResp.ok) throw new Error(`Failed to fetch file list: ${listResp.status}`);
  const files: string[] = await listResp.json();

  let mounted = 0;
  const batchSize = 20;

  // Mount files in parallel batches to speed up loading
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (file) => {
        const resp = await fetch(`${baseUrl}/${file}`);
        if (!resp.ok) return null;
        const content = await resp.text();
        return { file, content };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        const { file, content } = result.value;
        await f.mountFile(`/pob/${file}`, content);
        mounted++;
      }
    }
  }

  // Also mount runtime support files
  const runtimeFiles = [
    "runtime/xml.lua",
    "runtime/base64.lua",
    "runtime/dkjson.lua",
    "runtime/sha1/init.lua",
    "runtime/sha1/common.lua",
    "runtime/sha1/pure_lua_ops.lua",
    "runtime/sha1/lua53_ops.lua",
    "runtime/sha1/bit32_ops.lua",
    "runtime/sha1/bit_ops.lua",
    "runtime/sha2.lua",
    "runtime/socket.lua",
  ];

  for (const file of runtimeFiles) {
    try {
      const resp = await fetch(`${baseUrl}/${file}`);
      if (!resp.ok) continue;
      const content = await resp.text();
      const mountPath = file.replace("runtime/", "/pobrt/");
      await f.mountFile(mountPath, content);
      mounted++;
    } catch {
      // skip optional runtime files
    }
  }

  return mounted;
}

async function preloadTreeData(
  luaEngine: Awaited<ReturnType<import("wasmoon").default["createEngine"]>>,
  luaFactory: import("wasmoon").default,
  baseUrl: string,
  version: string,
  progressId: number
): Promise<boolean> {
  try {
    progress(progressId, `Loading tree data (${version})...`);
    const [treeResp, spritesResp] = await Promise.all([
      fetch(`${baseUrl}/TreeData/${version}/tree.json`),
      fetch(`${baseUrl}/TreeData/${version}/sprites.json`),
    ]);

    if (!treeResp.ok) return false;

    // Get JSON as text - we'll parse it inside Lua with dkjson
    // to create native Lua tables (global.set creates userdata proxies
    // that break pairs/ipairs/# operators in PoB code)
    const treeJson = await treeResp.text();
    const spritesJson = spritesResp.ok ? await spritesResp.text() : null;

    progress(progressId, "Parsing tree data...");

    luaEngine.global.set("_tsc_tree_json", treeJson);
    await luaEngine.doString(`
      local dkjson = require("dkjson")
      _tsc_preloaded_tree = dkjson.decode(_tsc_tree_json)
      _tsc_tree_json = nil

      -- JSON object keys are always strings, but PoB's tree.lua uses
      -- integer keys for nodes and groups (e.g. [28609]= {...}).
      -- Convert string-numeric keys back to integers.
      local function rekey_numeric(tbl)
        local fixes = {}
        for k, v in pairs(tbl) do
          if type(k) == "string" then
            local n = tonumber(k)
            if n and n == math.floor(n) then
              fixes[#fixes+1] = { k, n, v }
            end
          end
        end
        for _, fix in ipairs(fixes) do
          tbl[fix[1]] = nil
          tbl[fix[2]] = fix[3]
        end
      end
      if _tsc_preloaded_tree.nodes then rekey_numeric(_tsc_preloaded_tree.nodes) end
      if _tsc_preloaded_tree.groups then rekey_numeric(_tsc_preloaded_tree.groups) end
    `);

    if (spritesJson) {
      luaEngine.global.set("_tsc_sprites_json", spritesJson);
      await luaEngine.doString(`
        local dkjson = require("dkjson")
        _tsc_preloaded_sprites = dkjson.decode(_tsc_sprites_json)
        _tsc_sprites_json = nil
      `);
    }

    // Mount stub files that return the pre-loaded native Lua tables
    // instead of the 2.9 MB Lua table literal
    await luaFactory.mountFile(
      `/pob/TreeData/${version}/tree.lua`,
      "return _tsc_preloaded_tree"
    );
    if (spritesJson) {
      await luaFactory.mountFile(
        `/pob/TreeData/${version}/sprites.lua`,
        "return _tsc_preloaded_sprites"
      );
    }

    progress(progressId, "Tree data ready");
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    progress(progressId, `Tree preload failed: ${msg.substring(0, 200)}`);
    return false;
  }
}

async function handleInit(id: number, _gameId: string): Promise<void> {
  try {
    progress(id, "Loading wasmoon...");
    const wasmoon = await import("wasmoon");
    const LuaFactory = wasmoon.LuaFactory;

    progress(id, "Creating Lua VM...");
    factory = new LuaFactory();
    lua = await factory.createEngine({
      openStandardLibs: true,
      injectObjects: true,
    });

    progress(id, "Injecting HeadlessWrapper shims...");
    await lua.doString(LUA_SHIMS);

    progress(id, "Mounting PoB files...");
    const mounted = await fetchAndMountFiles(factory, "/data/pob");
    progress(id, `Mounted ${mounted} files`);

    // Set up Lua package path and working directory so loadfile finds PoB files
    await lua.doString(`
      package.path = "/pob/?.lua;/pob/?/init.lua;/pobrt/?.lua;/pobrt/?/init.lua;" .. package.path

      -- Override loadfile to search in /pob/ when relative paths are used
      local _orig_loadfile = loadfile
      loadfile = function(path, ...)
        local f, e = _orig_loadfile(path, ...)
        if f then return f, e end
        -- Try prepending /pob/
        if not path:match("^/") then
          f, e = _orig_loadfile("/pob/" .. path, ...)
          if f then return f, e end
        end
        return nil, e
      end

      -- Override dofile similarly
      local _orig_dofile = dofile
      dofile = function(path, ...)
        -- Try original path first
        local ok, res = pcall(_orig_dofile, path, ...)
        if ok then return res end
        -- Try /pob/ prefix
        if not path:match("^/") then
          return _orig_dofile("/pob/" .. path, ...)
        end
        error(res)
      end

      -- io.open override is already set up in LUA_SHIMS with /pob/ search
    `);

    // Test Lua works
    await lua.doString('_tsc_ready = true');
    const ready = lua.global.get("_tsc_ready");
    if (!ready) throw new Error("Lua VM failed self-test");

    // Preload tree JSON data to bypass slow Lua table parsing.
    // Must run after package.path is set so dkjson can be required.
    await preloadTreeData(lua, factory, "/data/pob", "3_29", id);

    // Boot sequence matching SE's HeadlessWrapper pattern:
    // 1. dofile Launch.lua (sets up globals, loads Main module)
    // 2. runCallback("OnInit") (initializes the app)
    // 3. runCallback("OnFrame") (advances state machine)
    // 4. newBuild() / loadBuildFromXML() available after this

    progress(id, "Booting Launch.lua...");
    const bootResult = await lua.doString(`
      local steps = {}
      local errors = {}

      -- Step 1: Load Launch.lua
      local ok, err = pcall(dofile, "/pob/Launch.lua")
      if ok then
        table.insert(steps, "Launch.lua loaded")
      else
        table.insert(errors, "Launch.lua: " .. tostring(err))
      end

      -- Step 1.5: Disable update checks before OnInit runs them
      if mainObject then
        mainObject.CheckForUpdate = function() end
      end

      -- Step 2: Run OnInit
      if ok and mainObject and mainObject.OnInit then
        local ok2, err2 = xpcall(function() runCallback("OnInit") end, debug.traceback)
        if ok2 then
          table.insert(steps, "OnInit done")
          -- Check if Main module loaded
          if launch and launch.main then
            table.insert(steps, "Main module loaded")
          elseif launch and launch.promptMsg then
            table.insert(errors, "Main prompt: " .. tostring(launch.promptMsg))
          else
            table.insert(errors, "Main module is nil after OnInit")
          end
        else
          table.insert(errors, "OnInit: " .. tostring(err2))
        end
      end

      -- Step 3: Run OnFrame to advance state
      if mainObject and mainObject.OnFrame then
        for i = 1, 3 do
          local ok3, err3 = pcall(function() runCallback("OnFrame") end)
          if not ok3 then
            table.insert(errors, "OnFrame " .. i .. ": " .. tostring(err3))
            break
          end
        end
        table.insert(steps, "OnFrame done")
      end

      -- Step 4: Check main object state
      _tsc_has_main = launch and launch.main ~= nil
      _tsc_has_modes = launch and launch.main and launch.main.modes ~= nil
      _tsc_has_build = launch and launch.main and launch.main.modes and launch.main.modes["BUILD"] ~= nil

      -- Step 5: Try entering BUILD mode
      if launch and launch.main and launch.main.SetMode then
        local ok5, err5 = pcall(function()
          launch.main:SetMode("BUILD", false, "New Build")
          runCallback("OnFrame")
          build = launch.main.modes and launch.main.modes["BUILD"]
        end)
        if ok5 then
          table.insert(steps, "BUILD mode entered")
          _tsc_has_build = build ~= nil
        else
          table.insert(errors, "BUILD mode: " .. tostring(err5))
        end
      end

      -- Define helper functions for build loading
      function newBuild()
        if mainObject and mainObject.main and mainObject.main.SetMode then
          mainObject.main:SetMode("BUILD", false, "New Build")
          runCallback("OnFrame")
          build = mainObject.main.modes and mainObject.main.modes["BUILD"]
        end
      end

      function loadBuildFromXML(xmlText, name)
        local obj = launch or mainObject
        if obj and obj.main and obj.main.SetMode then
          obj.main:SetMode("BUILD", false, name or "", xmlText)
          runCallback("OnFrame")
          build = obj.main.modes and obj.main.modes["BUILD"]
        end
      end

      _tsc_launch_ok = #errors == 0
      _tsc_boot_steps = table.concat(steps, "; ")
      _tsc_boot_errors = table.concat(errors, "; ")
    `);

    const launchOk = lua.global.get("_tsc_launch_ok");
    const bootSteps = lua.global.get("_tsc_boot_steps") ?? "";
    const bootErrors = lua.global.get("_tsc_boot_errors") ?? "";
    const hasMain = lua.global.get("_tsc_has_main");
    const hasModes = lua.global.get("_tsc_has_modes");

    if (launchOk) {
      progress(id, `PoB booted: ${bootSteps}`);
    } else {
      progress(id, `PoB partial: ${bootSteps} | Errors: ${String(bootErrors).substring(0, 200)}`);
    }

    progress(id, `State: main=${!!hasMain} modes=${!!hasModes}`);

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

async function handleEvaluate(id: number, xml: string): Promise<void> {
  if (!initialized || !lua) {
    reply({ id, type: "error", message: "Engine not initialized" });
    return;
  }

  try {
    progress(id, "Evaluating build...");

    // Try to use the PoB engine if Launch.lua loaded
    const launchOk = lua.global.get("_tsc_launch_ok");

    const stats: BuildStats = {
      total_dps: 0,
      combined_dps: 0,
      total_ehp: 0,
      life: 60,
      energy_shield: 0,
      mana: 50,
      strength: 20,
      dexterity: 20,
      intelligence: 20,
      armour: 0,
      evasion: 16,
      evade_chance: 0,
      block_chance: 0,
      spell_block: 0,
      suppression: 0,
      phys_reduction: 0,
      fire_res: -60,
      cold_res: -60,
      lightning_res: -60,
      chaos_res: -60,
      fire_res_max: 75,
      cold_res_max: 75,
      lightning_res_max: 75,
      chaos_res_max: 75,
      life_regen: 0,
      mana_regen: 0.9,
      crit_chance: 0,
      crit_multiplier: 150,
      attack_speed: 1.2,
      hit_chance: 5,
      accuracy: 40,
      class_name: "Scion",
      ascendancy: "",
      level: 1,
      allocated_nodes: [],
      main_socket_group: 0,
    };

    // Try PoB evaluation
    try {
      lua.global.set("_tsc_build_xml", xml);

      progress(id, "Loading build XML...");
      await lua.doString(`
        _tsc_eval_ok = false
        _tsc_eval_error = nil
        _tsc_eval_stats = nil

        local ok, err = xpcall(function()
          loadBuildFromXML(_tsc_build_xml, "imported")
        end, debug.traceback)

        if not ok then
          _tsc_eval_error = "loadBuild: " .. tostring(err)
        end
      `);

      const loadErr = lua.global.get("_tsc_eval_error");
      if (loadErr) {
        console.warn("PoB loadBuild error:", String(loadErr).substring(0, 300));
      }

      progress(id, "Running calculations...");
      await lua.doString(`
        -- Run OnFrame cycles to let tree load and calcs settle.
        -- Tree parsing (2.9 MB) can take many frames.
        local maxFrames = 30
        for i = 1, maxFrames do
          if mainObject and mainObject.OnFrame then
            pcall(runCallback, "OnFrame")
          end
          local b = build or (mainObject and mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"])
          if b and b.calcsTab and b.calcsTab.mainOutput then
            break
          end
        end
      `);

      progress(id, "Extracting stats...");
      await lua.doString(`
        local ok, err = xpcall(function()
          local b = build or (mainObject and mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"])
          if not b then
            error("No build object after loadBuildFromXML")
          end

          local result = {}
          result.class_name = b.className or (b.spec and b.spec.curClassName) or "?"
          result.ascendancy = b.ascendClassName or (b.spec and b.spec.curAscendClassName) or ""
          result.level = b.characterLevel or 1

          if b.calcsTab and b.calcsTab.mainOutput then
            local out = b.calcsTab.mainOutput
            result.total_dps = out.TotalDPS or out.CombinedDPS or 0
            result.combined_dps = out.CombinedDPS or out.TotalDPS or 0
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
            result.crit_multiplier = out.CritMultiplier or 150
            result.attack_speed = out.Speed or 0
            result.hit_chance = out.HitChance or 0
            result.accuracy = out.Accuracy or 0
            result.life_regen = out.LifeRegen or 0
            result.mana_regen = out.ManaRegen or 0
            result.has_calcs = true
          else
            result.has_calcs = false
          end

          _tsc_eval_stats = result
          _tsc_eval_ok = true
        end, debug.traceback)

        if not ok then
          _tsc_eval_error = tostring(err)
        end
      `);

      const evalOk = lua.global.get("_tsc_eval_ok");
      const evalErr = lua.global.get("_tsc_eval_error");
      const luaStats = lua.global.get("_tsc_eval_stats");

      if (evalOk && luaStats && typeof luaStats === "object") {
        const ls = luaStats as Record<string, unknown>;
        for (const [key, value] of Object.entries(ls)) {
          if (key in stats) {
            (stats as Record<string, unknown>)[key] = value;
          }
        }
      } else if (evalErr) {
        console.warn("PoB eval error:", String(evalErr).substring(0, 300));
      }
    } catch (e) {
      console.warn("PoB eval exception:", e);
    }

    reply({
      id,
      type: "evaluated",
      stats,
      items: [],
      skills: [],
    });
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
      await handleEvaluate(msg.id, msg.xml);
      break;
    case "ping":
      reply({ id: msg.id, type: "pong" });
      break;
    case "debug": {
      if (!lua) { reply({ id: msg.id, type: "error", message: "not init" }); break; }
      try {
        const code = (msg as { id: number; type: string; code: string }).code;
        await lua.doString(`_tsc_debug_result = (function() ${code} end)()`);
        const result = lua.global.get("_tsc_debug_result");
        reply({ id: msg.id, type: "debug-result", result } as never);
      } catch (e) {
        reply({ id: msg.id, type: "error", message: String(e) } as never);
      }
      break;
    }
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
