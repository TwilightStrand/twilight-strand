import type { EngineRequest, EngineResponse, BuildStats, ItemData, SkillGroup, GemData } from "./types";

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
  -- Lua 5.4 compat shims for LuaJIT/5.1 APIs that PoB uses
  if not math.pow then math.pow = function(x, y) return x ^ y end end
  if not setfenv then setfenv = function() end end
  if not getfenv then getfenv = function() return {} end end

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

  -- Inflate: return pre-injected binary data keyed by the last-opened .zip path.
  -- Binary data is injected from JS via lua_pushlstring to avoid UTF-8 corruption.
  _tsc_last_opened_zip = nil
  _tsc_jewel_bin_data = {}
  Inflate = function(d)
    if _tsc_last_opened_zip then
      local key = _tsc_last_opened_zip:match("([^/]+)%.zip")
      if key and _tsc_jewel_bin_data[key] then
        return _tsc_jewel_bin_data[key]
      end
    end
    return ""
  end
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
    -- Track .zip opens for the Inflate shim
    if path:match("%.zip") then
      _tsc_last_opened_zip = path
    end
    -- Try /pob/ prefix for relative paths
    local f, e = _orig_io_open(path, mode)
    if f then return f, e end
    if not path:match("^/") then
      local prefixed = "/pob/" .. path
      if prefixed:match("%.zip") then _tsc_last_opened_zip = prefixed end
      f, e = _orig_io_open(prefixed, mode)
      if f then return f, e end
    end
    return nil, e
  end
`;

// --------------- IndexedDB cache for PoB files ---------------
const IDB_NAME = "tsc-engine-cache";
const IDB_VERSION = 1;
const IDB_STORE = "files";
const CACHE_KEY_POB = "pob-files-v1";
const CACHE_KEY_TREE = "tree-json-v1";
const CACHE_KEY_SPRITES = "sprites-json-v1";

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
  });
}

async function idbGet(key: string): Promise<unknown> {
  try {
    const db = await idbOpen();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const get = tx.objectStore(IDB_STORE).get(key);
      get.onsuccess = () => resolve(get.result ?? null);
      get.onerror = () => resolve(null);
    });
  } catch { return null; }
}

async function idbSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await idbOpen();
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
  } catch {}
}

// --------------- fetchAndMountFiles with IDB cache ---------------

async function fetchAndMountFiles(
  f: import("wasmoon").default,
  baseUrl: string,
  progressId?: number
): Promise<number> {
  // Try IndexedDB cache first
  const cached = await idbGet(CACHE_KEY_POB) as Record<string, string> | null;
  if (cached) {
    if (progressId !== undefined) progress(progressId, "Loading PoB files from cache...");
    let mounted = 0;
    const entries = Object.entries(cached);
    for (const [mountPath, content] of entries) {
      await f.mountFile(mountPath, content);
      mounted++;
    }
    return mounted;
  }

  // Cache miss - fetch essential files first (deferred loaded post-boot)
  let listUrl = `${baseUrl}/file-list-essential.json?v=${Date.now()}`;
  let listResp = await fetch(listUrl);
  if (!listResp.ok) {
    listUrl = `${baseUrl}/file-list.json?v=${Date.now()}`;
    listResp = await fetch(listUrl);
  }
  if (!listResp.ok) throw new Error(`Failed to fetch file list: ${listResp.status}`);
  const files: string[] = await listResp.json();

  let mounted = 0;
  const batchSize = 50;
  const toCache: Record<string, string> = {};

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
        const mountPath = `/pob/${file}`;
        await f.mountFile(mountPath, content);
        toCache[mountPath] = content;
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
      toCache[mountPath] = content;
      mounted++;
    } catch {
      // skip optional runtime files
    }
  }

  // Store in IndexedDB for next load
  idbSet(CACHE_KEY_POB, toCache).catch(() => {});

  return mounted;
}

// --------------- Timeless jewel binary data (lazy-loaded) ---------------
const JEWEL_BIN_CACHE_PREFIX = "jewel-bin-v1-";
const mountedJewelTypes = new Set<string>();

async function mountTimelessJewelData(
  f: import("wasmoon").default,
  luaEngine: Awaited<ReturnType<import("wasmoon").default["createEngine"]>>,
  baseUrl: string,
  jewelTypes: string[],
): Promise<number> {
  let mounted = 0;
  const L = luaEngine.global.address;
  const luaWasm = luaEngine.global.lua;

  for (const name of jewelTypes) {
    if (mountedJewelTypes.has(name)) continue;

    const cacheKey = JEWEL_BIN_CACHE_PREFIX + name;
    let data = await idbGet(cacheKey) as ArrayBuffer | null;

    if (!data) {
      try {
        const resp = await fetch(`${baseUrl}/Data/TimelessJewelData/${name}.bin`);
        if (!resp.ok) continue;
        data = await resp.arrayBuffer();
        idbSet(cacheKey, data).catch(() => {});
      } catch {
        continue;
      }
    }

    // Mount dummy .zip so PoB's loadJewelFile can open it and trigger Inflate
    await f.mountFile(`/pob/Data/TimelessJewelData/${name}.zip`, "PLACEHOLDER");

    // Inject binary data directly into Lua via lua_pushlstring (bypasses UTF-8 corruption).
    // Access Emscripten's memory management through the module property.
    const bytes = new Uint8Array(data);
    const mod = (luaWasm as unknown as { module: { _malloc: (n: number) => number; _free: (p: number) => void; HEAPU8: Uint8Array } }).module;
    const ptr = mod._malloc(bytes.length);
    mod.HEAPU8.set(bytes, ptr);
    luaWasm.lua_pushlstring(L, ptr, bytes.length);
    luaWasm.lua_setglobal(L, `_tsc_jewel_raw_${name}`);
    mod._free(ptr);

    // Move from global into the _tsc_jewel_bin_data table for the Inflate shim
    await luaEngine.doString(`_tsc_jewel_bin_data["${name}"] = _tsc_jewel_raw_${name}; _tsc_jewel_raw_${name} = nil`);

    mountedJewelTypes.add(name);
    mounted++;
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

    // Try IndexedDB cache for tree/sprites JSON
    let treeJson = await idbGet(`${CACHE_KEY_TREE}-${version}`) as string | null;
    let spritesJson = await idbGet(`${CACHE_KEY_SPRITES}-${version}`) as string | null;

    if (treeJson) {
      progress(progressId, "Tree data loaded from cache");
    } else {
      const [treeResp, spritesResp] = await Promise.all([
        fetch(`${baseUrl}/TreeData/${version}/tree.json`),
        fetch(`${baseUrl}/TreeData/${version}/sprites.json`),
      ]);

      if (!treeResp.ok) return false;

      treeJson = await treeResp.text();
      spritesJson = spritesResp.ok ? await spritesResp.text() : null;

      // Cache for next load
      idbSet(`${CACHE_KEY_TREE}-${version}`, treeJson).catch(() => {});
      if (spritesJson) idbSet(`${CACHE_KEY_SPRITES}-${version}`, spritesJson).catch(() => {});
    }

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
    const mounted = await fetchAndMountFiles(factory, "/data/pob", id);
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
      _tsc_boot_info = table.concat(steps, "; ") .. (#errors > 0 and (" | ERR: " .. table.concat(errors, "; ")) or "")
    `);

    const launchOk = lua.global.get("_tsc_launch_ok");
    const bootSteps = lua.global.get("_tsc_boot_steps") ?? "";
    const bootErrors = lua.global.get("_tsc_boot_errors") ?? "";
    const hasMain = lua.global.get("_tsc_has_main");
    const hasModes = lua.global.get("_tsc_has_modes");

    if (!launchOk) console.warn("[boot] PARTIAL:", bootErrors);

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

async function handleEvaluate(id: number, xml: string, config?: Record<string, string | boolean | number>): Promise<void> {
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
      full_dps: 0,
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
      mana_unreserved: 50,
      life_unreserved: 60,
      mana_reserved_percent: 0,
      crit_chance: 0,
      crit_multiplier: 150,
      attack_speed: 1.2,
      hit_chance: 5,
      accuracy: 40,
      ward: 0,
      total_dps_with_minions: 0,
      bleed_dps: 0,
      poison_dps: 0,
      ignite_dps: 0,
      impale_dps: 0,
      life_leech_rate: 0,
      es_leech_rate: 0,
      es_regen: 0,
      es_recharge_rate: 0,
      class_name: "Scion",
      ascendancy: "",
      level: 1,
      allocated_nodes: [],
      main_socket_group: 0,
      tree_version: "3_29",
    };

    // Try PoB evaluation
    try {
      // Pre-mount timeless jewel binary data before loading the build.
      // The tree builder needs this data during PassiveSpec:BuildAllDependsAndPaths.
      if (factory) {
        const JEWEL_NAMES: Record<string, string> = {
          "Glorious Vanity": "GloriousVanity",
          "Lethal Pride": "LethalPride",
          "Brutal Restraint": "BrutalRestraint",
          "Militant Faith": "MilitantFaith",
          "Elegant Hubris": "ElegantHubris",
        };
        const needed: string[] = [];
        for (const [displayName, fileName] of Object.entries(JEWEL_NAMES)) {
          if (xml.includes(displayName)) {
            needed.push(fileName);
          }
        }
        if (needed.length > 0) {
          try {
            progress(id, `Loading timeless jewel data (${needed.join(", ")})...`);
            const count = await mountTimelessJewelData(factory, lua!, "/data/pob", needed);
            if (count > 0 && lua) {
              await lua.doString(`
                pcall(function()
                  if data and data.timelessJewelLUTs then
                    for k in pairs(data.timelessJewelLUTs) do
                      data.timelessJewelLUTs[k] = nil
                    end
                  end
                end)
              `);
            }
          } catch (e) {
            console.warn("[jewel-error]", e instanceof Error ? e.message : String(e));
          }
        }
      }

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
        console.warn("PoB loadBuild error:", String(loadErr).substring(0, 500));
      }

      // Diagnose item set selection
      await lua.doString(`
        _tsc_itemset_diag = "no-build"
        pcall(function()
          local b = build or (mainObject and mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"])
          if not b then return end
          local parts = {}
          if b.itemsTab then
            parts[#parts+1] = "activeSetId=" .. tostring(b.itemsTab.activeItemSetId or "nil")
            local numSets = 0
            if b.itemsTab.itemSets then
              for k in pairs(b.itemsTab.itemSets) do numSets = numSets + 1 end
            end
            parts[#parts+1] = "numSets=" .. numSets
            -- Count equipped gear slots (not jewel sockets)
            local equipped = 0
            local emptyGear = {}
            if b.itemsTab.orderedSlots then
              for _, slot in ipairs(b.itemsTab.orderedSlots) do
                if not slot.nodeId then
                  if slot.selItemId and slot.selItemId > 0 then
                    equipped = equipped + 1
                  else
                    if #emptyGear < 5 then
                      emptyGear[#emptyGear+1] = slot.slotName or "?"
                    end
                  end
                end
              end
            end
            parts[#parts+1] = "equipped=" .. equipped
            if #emptyGear > 0 then
              parts[#parts+1] = "empty=[" .. table.concat(emptyGear, ",") .. "]"
            end
            -- Check active item set's slot assignments
            if b.itemsTab.activeItemSet then
              local setSlots = 0
              for k, v in pairs(b.itemsTab.activeItemSet) do
                if type(v) == "number" and v > 0 then setSlots = setSlots + 1 end
                if type(v) == "table" and v.selItemId and v.selItemId > 0 then setSlots = setSlots + 1 end
              end
              parts[#parts+1] = "activeSetSlots=" .. setSlots
              parts[#parts+1] = "setTitle=" .. tostring(b.itemsTab.activeItemSet.title or "nil")
            end
          end
          -- Check spec
          if b.spec then
            parts[#parts+1] = "specTitle=" .. tostring(b.spec.title or "nil")
          end
          _tsc_itemset_diag = table.concat(parts, " ")
        end)
      `);
      const itemsetDiag = lua.global.get("_tsc_itemset_diag");
      console.log("[itemset]", String(itemsetDiag ?? "UNSET"));

      // Auto-apply combat config defaults ONLY for builds with empty config
      // (e.g. poe.ninja imports that lack any config settings)
      await lua.doString(`
        pcall(function()
          local b = build or (mainObject and mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"])
          if not b or not b.configTab or not b.configTab.input then return end
          local ci = b.configTab.input
          -- Count existing config entries to detect empty config
          local configCount = 0
          for _ in pairs(ci) do configCount = configCount + 1 end
          -- Only auto-apply if config is mostly empty (< 3 entries = no user config)
          if configCount >= 3 then return end
          ci.usePowerCharges = true
          ci.useFrenzyCharges = true
          pcall(function() b.configTab:BuildModList() end)
          b.buildFlag = true
        end)
      `);

      progress(id, "Running calculations...");
      await lua.doString(`
        -- Phase 1: Run OnFrame cycles to let the mode switch happen and
        -- the build fully initialize (parse XML, load items, tree, config).
        -- PoB's SetMode is deferred; the actual init happens across frames.
        local maxInitFrames = 40
        for i = 1, maxInitFrames do
          if mainObject and mainObject.OnFrame then
            pcall(runCallback, "OnFrame")
          end
        end

        -- Phase 2: Force a full recalc. The build should be loaded now.
        -- Set buildFlag to trigger calcsTab:BuildOutput() on next OnFrame.
        local b = build or (mainObject and mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"])
        if b then
          -- Force config tab to rebuild its mod list (applies charges, boss, shock etc.)
          if b.configTab then
            pcall(function() b.configTab:BuildModList() end)
          end
          b.buildFlag = true
        end

        -- Phase 3: Run more frames for the full calc pipeline to complete.
        -- Wait until CombinedDPS stabilizes across consecutive frames.
        local maxCalcFrames = 200
        local lastDPS = -1
        local stableCount = 0
        for i = 1, maxCalcFrames do
          if mainObject and mainObject.OnFrame then
            pcall(runCallback, "OnFrame")
          end
          b = build or (mainObject and mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"])
          if b and b.calcsTab and b.calcsTab.mainOutput then
            local curDPS = b.calcsTab.mainOutput.CombinedDPS or b.calcsTab.mainOutput.TotalDPS or 0
            local curES = b.calcsTab.mainOutput.EnergyShield or 0
            local key = curDPS * 1000 + curES
            if key == lastDPS and curDPS > 0 then
              stableCount = stableCount + 1
              if stableCount >= 3 then break end
            else
              stableCount = 0
            end
            lastDPS = key
          end
        end
      `);

      // If calcsTab.mainOutput is nil, try calling BuildOutput explicitly
      try {
        await lua.doString(`
          local ok2, err2 = pcall(function()
            local b = build or (mainObject and mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"])
            local hasB = b ~= nil
            local hasCT = hasB and b.calcsTab ~= nil
            local moType = hasCT and type(b.calcsTab.mainOutput) or "N/A"
            local hasEnv = hasCT and b.calcsTab.mainEnv ~= nil
            _tsc_build_output_fallback = "b=" .. tostring(hasB) .. " ct=" .. tostring(hasCT) .. " mo=" .. moType .. " env=" .. tostring(hasEnv)
            if hasB and hasCT and not b.calcsTab.mainOutput then
              local ok, err = xpcall(function()
                b.calcsTab:BuildOutput()
              end, debug.traceback)
              if ok then
                _tsc_build_output_fallback = _tsc_build_output_fallback .. " EXPLICIT_OK"
                if b.calcsTab.mainOutput then
                  _tsc_build_output_fallback = _tsc_build_output_fallback .. " dps=" .. tostring(b.calcsTab.mainOutput.CombinedDPS or 0)
                end
              else
                _tsc_build_output_fallback = _tsc_build_output_fallback .. " EXPLICIT_FAIL:" .. tostring(err):sub(1, 400)
              end
            end
          end)
          if not ok2 then
            _tsc_build_output_fallback = "OUTER_ERR:" .. tostring(err2):sub(1, 400)
          end
        `);
      } catch (e) {
        console.warn("[build-output-fallback] JS error:", e instanceof Error ? e.message : String(e));
      }
      const fallback = lua.global.get("_tsc_build_output_fallback");
      console.log("[build-output-fallback]", String(fallback ?? "UNSET"));

      // Compact engine debug
      await lua.doString(`
        local b = build or (mainObject and mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"])
        _tsc_debug_info = ""
        if not b then
          _tsc_debug_info = "NO_BUILD"
        else
          pcall(function()
            local o = b.calcsTab and b.calcsTab.mainOutput
            if o then
              _tsc_debug_info = "dps=" .. tostring(o.CombinedDPS or 0) .. " es=" .. tostring(o.EnergyShield or 0) .. " life=" .. tostring(o.Life or 0) .. " pwr=" .. tostring(o.PowerCharges or 0) .. " abs=" .. tostring(o.AbsorptionCharges or 0)
              if o.FullDPS and o.FullDPS > 0 then _tsc_debug_info = _tsc_debug_info .. " full=" .. tostring(o.FullDPS) end
            else
              _tsc_debug_info = "NO_OUTPUT"
              -- Debug why no output
              if b.calcsTab then
                _tsc_debug_info = _tsc_debug_info .. " calcsTab=yes"
                if b.calcsTab.mainEnv then _tsc_debug_info = _tsc_debug_info .. " mainEnv=yes" end
              else
                _tsc_debug_info = _tsc_debug_info .. " calcsTab=NIL"
              end
              _tsc_debug_info = _tsc_debug_info .. " mainGrp=" .. tostring(b.mainSocketGroup)
              if b.skillsTab and b.skillsTab.socketGroupList then
                _tsc_debug_info = _tsc_debug_info .. " skills=" .. #b.skillsTab.socketGroupList
                for i, g in ipairs(b.skillsTab.socketGroupList) do
                  local gems = g.gemList and #g.gemList or 0
                  _tsc_debug_info = _tsc_debug_info .. " g" .. i .. "=" .. (g.slot or "?") .. "/" .. gems .. "gems"
                  if i >= 5 then break end
                end
              end
            end
          end)
          pcall(function()
            if b.spec and b.spec.allocNodes then
              local nc = 0; for _ in pairs(b.spec.allocNodes) do nc = nc + 1 end
              _tsc_debug_info = _tsc_debug_info .. " nodes=" .. nc
            end
          end)
          pcall(function()
            if b.calcsTab and b.calcsTab.mainEnv and b.calcsTab.mainEnv.player and b.calcsTab.mainEnv.player.mainSkill then
              local ms = b.calcsTab.mainEnv.player.mainSkill
              _tsc_debug_info = _tsc_debug_info .. " skill=" .. tostring(ms.activeEffect and ms.activeEffect.grantedEffect and ms.activeEffect.grantedEffect.name or "?")
            end
          end)
          -- INC/MORE damage from modDB
          pcall(function()
            local env = b.calcsTab.mainEnv or b.calcsTab.calcsEnv
            if env and env.modDB and env.modDB.mods then
              local incDmg, moreDmg, critBase = 0, 1.0, 0
              for _, name in ipairs({"Damage", "SpellDamage", "ColdDamage", "ElementalDamage"}) do
                local mods = env.modDB.mods[name]
                if mods then
                  for _, m in ipairs(mods) do
                    if m.type == "INC" and type(m.value) == "number" then incDmg = incDmg + m.value
                    elseif m.type == "MORE" and type(m.value) == "number" then moreDmg = moreDmg * (1 + m.value / 100) end
                  end
                end
              end
              local critMods = env.modDB.mods["CritMultiplier"]
              if critMods then for _, m in ipairs(critMods) do if m.type == "BASE" and type(m.value) == "number" then critBase = critBase + m.value end end end
              _tsc_debug_info = _tsc_debug_info .. " INC=" .. string.format("%.0f", incDmg) .. "%% MORE=" .. string.format("%.2f", moreDmg) .. "x crit=" .. string.format("%.0f", critBase + 150) .. "%%"
            end
          end)
          -- Jewel socket diagnostics - just non-zero sockets + Elegant Hubris item IDs
          pcall(function()
            if b.spec and b.spec.jewels then
              local socketed = {}
              for nodeId, itemId in pairs(b.spec.jewels) do
                if itemId > 0 then
                  local item = b.itemsTab and b.itemsTab.items[itemId]
                  local name = item and (item.title or item.name or "?") or "nil"
                  socketed[#socketed+1] = tostring(nodeId) .. "=id" .. tostring(itemId) .. ":" .. name
                end
              end
              _tsc_debug_info = _tsc_debug_info .. " socketed=[" .. table.concat(socketed, ",") .. "]"
            end
            -- Active item set and spec
            if b.itemsTab then
              _tsc_debug_info = _tsc_debug_info .. " itemSet=" .. tostring(b.itemsTab.activeItemSetId or "?")
            end
            if b.spec then
              _tsc_debug_info = _tsc_debug_info .. " specIdx=" .. tostring(b.spec.treeVersion or "?")
            end
            -- Find all Elegant Hubris items and their IDs
            if b.itemsTab and b.itemsTab.items then
              local eh = {}
              for id, item in pairs(b.itemsTab.items) do
                if item.title and item.title:match("Elegant Hubris") then
                  eh[#eh+1] = "id" .. tostring(id) .. ":" .. (item.title or "") .. " slot=" .. tostring(item.slotName or "NONE")
                end
              end
              if #eh > 0 then _tsc_debug_info = _tsc_debug_info .. " EH=[" .. table.concat(eh, ",") .. "]" end
            end
          end)
        end
      `);
      const debugInfo = String(lua.global.get("_tsc_debug_info") ?? "");
      (stats as Record<string, unknown>)._debug = debugInfo;
      console.log("[engine]", debugInfo);

      // Jewel mod diagnostics - check "New Item" rare jewels directly from items list
      await lua.doString(`
        _tsc_jewel_mods = "CHECKING "
        pcall(function()
          local b = build or (mainObject and mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"])
          if not b or not b.itemsTab then _tsc_jewel_mods = "NO_BUILD"; return end
          local parts = {}
          for id, item in pairs(b.itemsTab.items) do
            if item.type == "Jewel" and (item.name == "New Item" or item.rarity == "RARE") then
              local modCount = 0
              if item.modList then
                local i = 1
                while rawget(item.modList, i) do modCount = modCount + 1; i = i + 1 end
              end
              local explicitCount = item.explicitModLines and #item.explicitModLines or 0
              local sampleMods = {}
              if item.modList and modCount > 0 then
                for j = 1, math.min(2, modCount) do
                  local m = rawget(item.modList, j)
                  if m then sampleMods[#sampleMods+1] = m.name .. "=" .. tostring(m.value) end
                end
              end
              parts[#parts+1] = "id" .. id .. ":" .. explicitCount .. "exp/" .. modCount .. "mods"
              if #sampleMods > 0 then parts[#parts] = parts[#parts] .. "[" .. table.concat(sampleMods, ",") .. "]" end
            end
          end
          _tsc_jewel_mods = #parts .. " rare jewels: " .. table.concat(parts, " ")
        end)
      `);
      const jewelMods = String(lua.global.get("_tsc_jewel_mods") ?? "");
      console.log("[jewel-mods]", jewelMods);

      // Detailed damage breakdown for DPS gap analysis
      await lua.doString(`
        _tsc_dmg_breakdown = ""
        local _dmg_ok, _dmg_err = pcall(function()
          local b = build or (mainObject and mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"])
          if not b or not b.calcsTab or not b.calcsTab.mainEnv then return end
          local env = b.calcsTab.mainEnv
          if not env.player or not env.player.mainSkill then return end
          local ms = env.player.mainSkill

          local parts = {}
          local function a(k, v) if v and type(v) == "number" and v ~= 0 then parts[#parts+1] = k .. "=" .. string.format("%.1f", v) end end

          -- Dump all numeric keys from mainOutput to find what exists
          local mainOut = b.calcsTab.mainOutput
          if mainOut then
            local outKeys = {}
            for k, v in pairs(mainOut) do
              if type(v) == "number" and v ~= 0 then
                outKeys[#outKeys+1] = k .. "=" .. string.format("%.4g", v)
              end
            end
            table.sort(outKeys)
            -- Show first 30 output keys to understand what's available
            local shown = {}
            for i = 1, math.min(30, #outKeys) do shown[i] = outKeys[i] end
            parts[#parts+1] = "OUT=[" .. table.concat(shown, ";") .. "](" .. #outKeys .. "total)"
          else
            parts[#parts+1] = "mainOutput=NIL"
          end

          -- Gem level and added damage
          if ms.activeEffect and ms.activeEffect.level then
            parts[#parts+1] = "gemLv=" .. ms.activeEffect.level
          end

          -- Skill part
          parts[#parts+1] = "part=" .. tostring(ms.skillPart or "nil")
          if ms.skillPartName then
            parts[#parts+1] = "partName=" .. ms.skillPartName
          end

          -- Stages
          a("Stages", mainOut and mainOut.Stages)
          a("StageCountMax", ms.skillData and ms.skillData.stagesMax)

          -- Support multipliers
          if ms.supportList then
            local sups = {}
            for _, sup in ipairs(ms.supportList) do
              if sup.activeEffect and sup.activeEffect.grantedEffect then
                sups[#sups+1] = sup.activeEffect.grantedEffect.name
              end
            end
            if #sups > 0 then
              parts[#parts+1] = "supports=[" .. table.concat(sups, ",") .. "]"
            end
          end

          _tsc_dmg_breakdown = table.concat(parts, " ")

          -- Sum INC and MORE damage mods
          local incDmg, moreDmg = 0, 1.0
          local incCrit, baseCrit = 0, 0
          if env.modDB and env.modDB.mods then
            -- Sum increased spell/cold/elemental damage
            for _, name in ipairs({"Damage", "SpellDamage", "ColdDamage", "ElementalDamage"}) do
              local mods = env.modDB.mods[name]
              if mods then
                for _, m in ipairs(mods) do
                  if m.type == "INC" and type(m.value) == "number" then
                    incDmg = incDmg + m.value
                  elseif m.type == "MORE" and type(m.value) == "number" then
                    moreDmg = moreDmg * (1 + m.value / 100)
                  end
                end
              end
            end
            -- Crit multi total
            local critMods = env.modDB.mods["CritMultiplier"]
            if critMods then
              for _, m in ipairs(critMods) do
                if m.type == "BASE" and type(m.value) == "number" then
                  baseCrit = baseCrit + m.value
                end
              end
            end
          end
          _tsc_dmg_breakdown = _tsc_dmg_breakdown .. " INC=" .. string.format("%.0f", incDmg) .. "%% MORE=" .. string.format("%.2f", moreDmg) .. "x critMultBase=" .. string.format("%.0f", baseCrit)
        end)
        if not _dmg_ok then _tsc_dmg_breakdown = "ERR:" .. tostring(_dmg_err) end
      `);
      const dmgBreakdown = String(lua.global.get("_tsc_dmg_breakdown") ?? "");
      if (dmgBreakdown.length > 0) {
        console.log("[dmg]", dmgBreakdown);
      }

      // LUT data integrity check
      await lua.doString(`
        _tsc_lut_check = ""
        pcall(function()
          if data and data.timelessJewelLUTs and data.timelessJewelLUTs[5] then
            local lut = data.timelessJewelLUTs[5]
            if lut.data then
              local len = #lut.data
              _tsc_lut_check = "LUT5=#" .. len
              -- Check first 20 bytes for corruption (bytes > 127 would be mangled by UTF-8)
              local bytes = {}
              for i = 1, math.min(20, len) do
                bytes[#bytes+1] = lut.data:byte(i)
              end
              _tsc_lut_check = _tsc_lut_check .. " first20=[" .. table.concat(bytes, ",") .. "]"
              -- Check byte distribution - if UTF-8 corrupted, bytes > 127 would be wrong
              local gt127 = 0
              local zeros = 0
              local sample = math.min(1000, len)
              for i = 1, sample do
                local b = lut.data:byte(i)
                if b > 127 then gt127 = gt127 + 1 end
                if b == 0 then zeros = zeros + 1 end
              end
              _tsc_lut_check = _tsc_lut_check .. " gt127=" .. gt127 .. "/" .. sample .. " zeros=" .. zeros
            else
              _tsc_lut_check = "LUT5=no-data"
            end
          else
            _tsc_lut_check = "no-LUT5"
          end

          -- Check conquered node replacements (both allocated and all nodes)
          local b = build or (mainObject and mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"])
          if b and b.spec then
            local conquered = 0
            local replaced = 0
            local sampleNodes = {}
            local byType = {Notable=0, Normal=0, Keystone=0, other=0}
            local allConquered = 0
            for id, node in pairs(b.spec.nodes) do
              if node.conqueredBy then allConquered = allConquered + 1 end
            end
            for id, node in pairs(b.spec.allocNodes) do
              if node.conqueredBy then
                conquered = conquered + 1
                local t = node.type or "other"
                byType[t] = (byType[t] or 0) + 1
                if node.sd and #node.sd > 0 then
                  replaced = replaced + 1
                  if #sampleNodes < 3 then
                    sampleNodes[#sampleNodes+1] = id .. ":" .. (node.dn or "?") .. ":" .. #node.sd .. "mods"
                  end
                end
              end
            end
            _tsc_lut_check = _tsc_lut_check .. " allConq=" .. allConquered .. " allocConq=" .. conquered .. " replaced=" .. replaced .. " types=N:" .. (byType.Notable or 0) .. "/n:" .. (byType.Normal or 0) .. "/K:" .. (byType.Keystone or 0)
            if #sampleNodes > 0 then
              _tsc_lut_check = _tsc_lut_check .. " [" .. table.concat(sampleNodes, ",") .. "]"
            end

            -- Test readLUT for ALL conquered notable nodes
            if data and data.readLUT then
              local okCount, failCount = 0, 0
              local failNodes = {}
              for id, node in pairs(b.spec.allocNodes) do
                if node.conqueredBy and node.type == "Notable" then
                  local jtype = 5
                  if node.conqueredBy.conqueror.type == "templar" then jtype = 4
                  elseif node.conqueredBy.conqueror.type == "karui" then jtype = 2
                  elseif node.conqueredBy.conqueror.type == "maraketh" then jtype = 3
                  elseif node.conqueredBy.conqueror.type == "vaal" then jtype = 1
                  end
                  local result = data.readLUT(node.conqueredBy.id, id, jtype)
                  if result and #result > 0 and result[1] then
                    okCount = okCount + 1
                  else
                    failCount = failCount + 1
                    if #failNodes < 3 then
                      failNodes[#failNodes+1] = id .. ":" .. (node.dn or "?") .. ":seed=" .. tostring(node.conqueredBy.id) .. ":t" .. jtype
                    end
                  end
                end
              end
              _tsc_lut_check = _tsc_lut_check .. " readLUT:ok=" .. okCount .. ",fail=" .. failCount
              if #failNodes > 0 then
                _tsc_lut_check = _tsc_lut_check .. " failNodes=[" .. table.concat(failNodes, "|") .. "]"
              end
            end
          end
        end)
      `);
      const lutCheck = lua.global.get("_tsc_lut_check");
      if (lutCheck) console.log("[lut-check]", String(lutCheck));

      // Apply any manual config overrides on top of what the XML set
      if (config && Object.keys(config).length > 0) {
        lua.global.set("_tsc_config", config);
        await lua.doString(`
          if _tsc_config then
            local b = build or (mainObject and mainObject.main and mainObject.main.modes and mainObject.main.modes["BUILD"])
            if b and b.configTab and b.configTab.input then
              for k, v in pairs(_tsc_config) do
                b.configTab.input[k] = v
              end
              pcall(function() b.configTab:BuildModList() end)
              b.buildFlag = true
              -- Run a few more frames for overrides to take effect
              for i = 1, 10 do
                if mainObject and mainObject.OnFrame then
                  pcall(runCallback, "OnFrame")
                end
              end
            end
            _tsc_config = nil
          end
        `);
      }

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

          -- Extract allocated node IDs from spec
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
            result.crit_multiplier = out.CritMultiplier or 150
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
            result.has_calcs = true
          else
            result.has_calcs = false
          end

          -- Extract items from itemsTab
          _tsc_eval_items = {}
          if b.itemsTab and b.itemsTab.items then
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
                _tsc_eval_items[idx] = {
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

          -- Extract skills from skillsTab
          _tsc_eval_skills = {}
          if b.skillsTab and b.skillsTab.socketGroupList then
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
              _tsc_eval_skills[i] = {
                slot = group.slot or "",
                enabled = group.enabled ~= false,
                gems = gems,
                label = group.displayLabel or group.slot or "Group " .. i,
                dps = groupDps,
              }
            end
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
          if (key in stats && key !== "allocated_nodes") {
            (stats as Record<string, unknown>)[key] = value;
          }
        }
        if (ls.allocated_nodes && typeof ls.allocated_nodes === "object") {
          stats.allocated_nodes = Object.values(ls.allocated_nodes as Record<string, number>).map(Number);
        }
      } else if (evalErr) {
        console.warn("PoB eval error:", String(evalErr).substring(0, 300));
      }
    } catch (e) {
      console.warn("PoB eval exception:", e);
    }

    // Extract items and skills from Lua globals
    const luaItems = lua.global.get("_tsc_eval_items");
    const luaSkills = lua.global.get("_tsc_eval_skills");

    const items: ItemData[] = [];
    if (luaItems && typeof luaItems === "object") {
      for (const item of Object.values(luaItems as Record<string, Record<string, unknown>>)) {
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
    }

    const skills: SkillGroup[] = [];
    if (luaSkills && typeof luaSkills === "object") {
      for (const group of Object.values(luaSkills as Record<string, Record<string, unknown>>)) {
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
    }

    reply({
      id,
      type: "evaluated",
      stats,
      items,
      skills,
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
      await handleEvaluate(msg.id, msg.xml, (msg as { config?: Record<string, string | boolean | number> }).config);
      break;
    case "ping":
      reply({ id: msg.id, type: "pong" });
      break;
    case "debug": {
      if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") {
        reply({ id: msg.id, type: "error", message: "debug disabled in production" } as never);
        break;
      }
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
