// App-wide settings, persisted to disk via tauri-plugin-store.
// Uses Svelte 5 runes so any component reading `settings.*` stays reactive.
import { type Store } from "@tauri-apps/plugin-store";
import { tryLoadStore } from "$lib/stores/persist";

export type ThemeChoice = "light" | "dark" | "system";
export type SplitOrientation = "horizontal" | "vertical";
export type ViewMode = "source" | "preview" | "split";

const STORE_FILE = "settings.json";

interface PersistShape {
  theme: ThemeChoice;
  splitOrientation: SplitOrientation;
  defaultViewMode: ViewMode;
}

const DEFAULTS: PersistShape = {
  theme: "system",
  splitOrientation: "vertical",
  defaultViewMode: "split",
};

class SettingsStore {
  theme = $state<ThemeChoice>(DEFAULTS.theme);
  splitOrientation = $state<SplitOrientation>(DEFAULTS.splitOrientation);
  defaultViewMode = $state<ViewMode>(DEFAULTS.defaultViewMode);

  /** The actually-applied light/dark value, after resolving "system". */
  resolvedTheme = $state<"light" | "dark">("light");

  #store: Store | null = null;
  #mql: MediaQueryList | null = null;

  async init() {
    this.#store = await tryLoadStore(STORE_FILE, { autoSave: true, defaults: {} });
    if (this.#store) {
      this.theme = (await this.#store.get<ThemeChoice>("theme")) ?? DEFAULTS.theme;
      this.splitOrientation =
        (await this.#store.get<SplitOrientation>("splitOrientation")) ?? DEFAULTS.splitOrientation;
      this.defaultViewMode =
        (await this.#store.get<ViewMode>("defaultViewMode")) ?? DEFAULTS.defaultViewMode;
    }
    this.#mql = window.matchMedia("(prefers-color-scheme: dark)");
    this.#mql.addEventListener("change", () => this.applyTheme());
    this.applyTheme();
  }

  applyTheme() {
    const systemDark = this.#mql?.matches ?? false;
    const dark = this.theme === "dark" || (this.theme === "system" && systemDark);
    this.resolvedTheme = dark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", this.resolvedTheme);
  }

  async setTheme(theme: ThemeChoice) {
    this.theme = theme;
    this.applyTheme();
    await this.#store?.set("theme", theme);
  }

  async setSplitOrientation(o: SplitOrientation) {
    this.splitOrientation = o;
    await this.#store?.set("splitOrientation", o);
  }

  async setDefaultViewMode(m: ViewMode) {
    this.defaultViewMode = m;
    await this.#store?.set("defaultViewMode", m);
  }
}

export const settings = new SettingsStore();
