import type { EngineRequest, EngineResponse } from "./types";

let initialized = false;

function reply(msg: EngineResponse): void {
  postMessage(msg);
}

function progress(id: number, stage: string): void {
  reply({ id, type: "progress", stage });
}

async function handleInit(id: number, _gameId: string): Promise<void> {
  try {
    progress(id, "Loading wasmoon...");

    // Dynamic import so the worker bundle doesn't fail at parse time
    // wasmoon is heavy (~1MB) and loads the Lua WASM binary
    const { LuaFactory } = await import("wasmoon");

    progress(id, "Creating Lua VM...");
    const factory = new LuaFactory();
    const lua = await factory.createEngine();

    progress(id, "Lua VM ready");

    // Store engine globally for subsequent messages
    (globalThis as Record<string, unknown>).__lua = lua;
    (globalThis as Record<string, unknown>).__factory = factory;

    // Test that Lua works
    lua.doStringSync('_tsc_ready = true');
    const ready = lua.global.get("_tsc_ready");
    if (!ready) {
      throw new Error("Lua VM failed self-test");
    }

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
  if (!initialized) {
    reply({ id, type: "error", message: "Engine not initialized" });
    return;
  }

  try {
    progress(id, "Evaluating build...");

    // Stub: return default stats until PoB Lua files are fully wired up
    // The full pipeline will: loadBuildFromXML(xml) → runCallback("OnFrame") → extract stats
    reply({
      id,
      type: "evaluated",
      stats: {
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
      },
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
