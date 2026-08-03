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
  private defaultTimeout = 120_000;
  private progressCallback?: (stage: string) => void;

  onProgress(cb: (stage: string) => void): void {
    this.progressCallback = cb;
  }

  async init(gameId: GameId = "poe1"): Promise<void> {
    if (this.worker) return;

    this.worker = new Worker("/engine-worker.js");

    this.worker.onmessage = (e: MessageEvent<EngineResponse>) => {
      const msg = e.data;

      if (msg.type === "progress") {
        this.progressCallback?.(msg.stage);
        return;
      }

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
    const resp = await this.send({ type: "evaluate", xml } as Omit<EngineRequest, "id">, 180_000);
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
    this.progressCallback = undefined;
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
