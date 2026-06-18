// Recently opened files (+ pinned), persisted via tauri-plugin-store.
import { type Store } from "@tauri-apps/plugin-store";
import { tryLoadStore } from "$lib/stores/persist";
import { orderedRecent } from "$lib/recent-util";

const STORE_FILE = "recent.json";
const MAX = 10;

class RecentStore {
  paths = $state<string[]>([]);
  pinned = $state<string[]>([]);
  #store: Store | null = null;

  /** Pinned first, then recents (de-duplicated). */
  entries = $derived(orderedRecent(this.paths, this.pinned));

  async init() {
    this.#store = await tryLoadStore(STORE_FILE, { autoSave: true, defaults: {} });
    if (this.#store) {
      this.paths = (await this.#store.get<string[]>("paths")) ?? [];
      this.pinned = (await this.#store.get<string[]>("pinned")) ?? [];
    }
  }

  async add(path: string) {
    this.paths = [path, ...this.paths.filter((p) => p !== path)].slice(0, MAX);
    await this.#store?.set("paths", this.paths);
  }

  async pin(path: string) {
    if (!this.pinned.includes(path)) this.pinned = [...this.pinned, path];
    await this.#store?.set("pinned", this.pinned);
  }

  async unpin(path: string) {
    this.pinned = this.pinned.filter((p) => p !== path);
    await this.#store?.set("pinned", this.pinned);
  }

  /** Clear the recent (unpinned) list; pinned entries are kept. */
  async clearRecent() {
    this.paths = [];
    await this.#store?.set("paths", []);
  }
}

export const recent = new RecentStore();
