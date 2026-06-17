// Recently opened file paths, persisted via tauri-plugin-store.
import { load, type Store } from "@tauri-apps/plugin-store";

const STORE_FILE = "recent.json";
const MAX = 10;

class RecentStore {
  paths = $state<string[]>([]);
  #store: Store | null = null;

  async init() {
    try {
      this.#store = await load(STORE_FILE, { autoSave: true, defaults: {} });
      this.paths = (await this.#store.get<string[]>("paths")) ?? [];
    } catch {
      // Not running under Tauri — keep in-memory only.
    }
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
