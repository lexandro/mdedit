// Recently opened file paths, persisted via tauri-plugin-store.
import { type Store } from "@tauri-apps/plugin-store";
import { tryLoadStore } from "$lib/stores/persist";

const STORE_FILE = "recent.json";
const MAX = 10;

class RecentStore {
  paths = $state<string[]>([]);
  #store: Store | null = null;

  async init() {
    this.#store = await tryLoadStore(STORE_FILE, { autoSave: true, defaults: {} });
    if (this.#store) this.paths = (await this.#store.get<string[]>("paths")) ?? [];
  }

  async add(path: string) {
    this.paths = [path, ...this.paths.filter((p) => p !== path)].slice(0, MAX);
    await this.#store?.set("paths", this.paths);
  }

  async remove(path: string) {
    this.paths = this.paths.filter((p) => p !== path);
    await this.#store?.set("paths", this.paths);
  }

  async clear() {
    this.paths = [];
    await this.#store?.set("paths", []);
  }
}

export const recent = new RecentStore();
