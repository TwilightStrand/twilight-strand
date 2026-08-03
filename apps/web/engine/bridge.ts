import type { EngineRequest, EngineResponse, BuildStats, ItemData, SkillGroup, GameId } from "./types";

type PendingRequest = {
  resolve: (value: EngineResponse) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class EngineBridge {
  private worker: Worker | null = null;
  private pending = new Map<number, PendingRequest>();
  private nextId = 1;
  private ready = false;
  private defaultTimeout = 60_000;

  async init(gameId: GameId = "poe1"): Promise<void> {
    if (this.worker) return;

    // Stub worker that returns default stats without wasmoon
    // TODO: Replace with real wasmoon worker once the bundling issue is resolved
    const workerCode = `
      self.onmessage = function(e) {
        var msg = e.data;
        if (msg.type === "init") {
          self.postMessage({ id: msg.id, type: "ready" });
        } else if (msg.type === "evaluate") {
          self.postMessage({
            id: msg.id,
            type: "evaluated",
            stats: {
              total_dps: 0, combined_dps: 0, total_ehp: 0,
              life: 60, energy_shield: 0, mana: 50,
              strength: 20, dexterity: 20, intelligence: 20,
              armour: 0, evasion: 16, evade_chance: 0,
              block_chance: 0, spell_block: 0, suppression: 0, phys_reduction: 0,
              fire_res: -60, cold_res: -60, lightning_res: -60, chaos_res: -60,
              fire_res_max: 75, cold_res_max: 75, lightning_res_max: 75, chaos_res_max: 75,
              life_regen: 0, mana_regen: 0.9,
              crit_chance: 0, crit_multiplier: 150,
              attack_speed: 1.2, hit_chance: 5, accuracy: 40,
              class_name: "Scion", ascendancy: "", level: 1,
              allocated_nodes: [], main_socket_group: 0
            },
            items: [],
            skills: []
          });
        } else if (msg.type === "ping") {
          self.postMessage({ id: msg.id, type: "pong" });
        }
      };
    `;
    const blob = new Blob([workerCode], { type: "application/javascript" });
    this.worker = new Worker(URL.createObjectURL(blob));

    this.worker.onmessage = (e: MessageEvent<EngineResponse>) => {
      const msg = e.data;
      const pending = this.pending.get(msg.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pending.delete(msg.id);
        pending.resolve(msg);
      }
    };

    this.worker.onerror = (e) => {
      console.error("[engine-bridge] worker error:", e);
    };

    const resp = await this.send({ type: "init", gameId } as Omit<EngineRequest, "id">);
    if (resp.type === "error") {
      throw new Error(resp.message);
    }
    this.ready = true;
  }

  async evaluate(xml: string): Promise<{
    stats: BuildStats;
    items: ItemData[];
    skills: SkillGroup[];
  }> {
    const resp = await this.send({ type: "evaluate", xml } as Omit<EngineRequest, "id">, 120_000);
    if (resp.type === "error") {
      throw new Error(resp.message);
    }
    if (resp.type !== "evaluated") {
      throw new Error(`Unexpected response type: ${resp.type}`);
    }
    return { stats: resp.stats, items: resp.items, skills: resp.skills };
  }

  isReady(): boolean {
    return this.ready;
  }

  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(new Error("Engine destroyed"));
    }
    this.pending.clear();
  }

  private send(
    msg: Omit<EngineRequest, "id">,
    timeout?: number
  ): Promise<EngineResponse> {
    if (!this.worker) {
      return Promise.reject(new Error("Worker not initialized"));
    }

    const id = this.nextId++;
    const request = { ...msg, id } as EngineRequest;

    return new Promise<EngineResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Engine request timed out: ${msg.type}`));
      }, timeout ?? this.defaultTimeout);

      this.pending.set(id, { resolve, reject, timer });
      this.worker!.postMessage(request);
    });
  }
}

let instance: EngineBridge | null = null;

export function getEngineBridge(): EngineBridge {
  if (!instance) {
    instance = new EngineBridge();
  }
  return instance;
}
