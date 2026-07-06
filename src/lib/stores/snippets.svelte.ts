// User-defined snippets, persisted via tauri-plugin-store. `all` (built-ins +
// user, user trigger wins) is what the picker and the inline /trigger
// completion consume.
import { type Store } from "@tauri-apps/plugin-store";
import { tryLoadStore } from "$lib/stores/persist";
import { BUILTIN_SNIPPETS, type Snippet } from "$lib/snippets";
import { mergeSnippets, parseUserSnippets, type UserSnippet } from "$lib/user-snippets";

const STORE_FILE = "snippets.json";

class SnippetsStore {
  user = $state<UserSnippet[]>([]);
  all: Snippet[] = $derived(mergeSnippets(BUILTIN_SNIPPETS, this.user));
  #store: Store | null = null;

  async init() {
    this.#store = await tryLoadStore(STORE_FILE, { autoSave: true, defaults: {} });
    if (this.#store) this.user = parseUserSnippets(await this.#store.get("user"));
  }

  async #persist(next: UserSnippet[]) {
    this.user = next;
    await this.#store?.set("user", next);
  }

  /** Insert or (matching on id) replace a user snippet. */
  async upsert(s: UserSnippet) {
    const exists = this.user.some((u) => u.id === s.id);
    await this.#persist(exists ? this.user.map((u) => (u.id === s.id ? s : u)) : [...this.user, s]);
  }

  async remove(id: string) {
    await this.#persist(this.user.filter((u) => u.id !== id));
  }
}

export const snippets = new SnippetsStore();
