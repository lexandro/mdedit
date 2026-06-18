// Persists the open-tab session (Notepad++ style): on restart the same files
// reopen, and unsaved/untitled buffers are restored so in-progress work survives
// a normal exit OR a machine restart. State is written continuously (debounced)
// rather than only on close, so an unexpected shutdown loses at most ~0.4s.
import { type Store } from "@tauri-apps/plugin-store";
import { tryLoadStore } from "$lib/stores/persist";
import { tabs, type SessionData } from "$lib/stores/tabs.svelte";
import { serializeSession } from "$lib/session-util";

const STORE_FILE = "session.json";

class SessionStore {
  #store: Store | null = null;
  #ready = false; // becomes true after restore, gating persistence
  #timer: ReturnType<typeof setTimeout> | null = null;

  /** Load the persisted session and recreate tabs. Call once on startup. */
  async restore() {
    try {
      this.#store = await tryLoadStore(STORE_FILE, { autoSave: false, defaults: {} });
      const data = await this.#store?.get<SessionData>("session");
      if (data?.tabs?.length) await tabs.applySession(data);
    } catch {
      // Nothing to restore, or restore failed.
    } finally {
      this.#ready = true;
    }
  }

  /** Debounced persist; call whenever tabs change. No-op until restore finishes. */
  schedulePersist() {
    if (!this.#ready) return;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => void this.#persist(), 400);
  }

  /** Write immediately (e.g. on window close). */
  async flush() {
    if (this.#timer) clearTimeout(this.#timer);
    await this.#persist();
  }

  async #persist() {
    if (!this.#store) return;
    await this.#store.set("session", serializeSession(tabs.tabs, tabs.activeId));
    await this.#store.save();
  }
}

export const session = new SessionStore();
