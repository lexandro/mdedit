// App-wide settings, persisted to disk via tauri-plugin-store.
// Uses Svelte 5 runes so any component reading `settings.*` stays reactive.
import { type Store } from "@tauri-apps/plugin-store";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { tryLoadStore } from "$lib/stores/persist";

export type ThemeChoice = "light" | "dark" | "system";
export type SplitOrientation = "horizontal" | "vertical";
export type ViewMode = "source" | "preview" | "split";

const STORE_FILE = "settings.json";

export const ZOOM_MIN = 0.8;
export const ZOOM_MAX = 1.8;
export const ZOOM_STEP = 0.1;
export const FONT_MIN = 10;
export const FONT_MAX = 28;

interface PersistShape {
  theme: ThemeChoice;
  splitOrientation: SplitOrientation;
  defaultViewMode: ViewMode;
  uiZoom: number;
  editorFontSize: number;
}

const DEFAULTS: PersistShape = {
  theme: "system",
  splitOrientation: "vertical",
  defaultViewMode: "split",
  uiZoom: 1,
  editorFontSize: 14,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

class SettingsStore {
  theme = $state<ThemeChoice>(DEFAULTS.theme);
  splitOrientation = $state<SplitOrientation>(DEFAULTS.splitOrientation);
  defaultViewMode = $state<ViewMode>(DEFAULTS.defaultViewMode);
  uiZoom = $state<number>(DEFAULTS.uiZoom);
  editorFontSize = $state<number>(DEFAULTS.editorFontSize);

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
      this.uiZoom = (await this.#store.get<number>("uiZoom")) ?? DEFAULTS.uiZoom;
      this.editorFontSize =
        (await this.#store.get<number>("editorFontSize")) ?? DEFAULTS.editorFontSize;
    }
    this.#mql = window.matchMedia("(prefers-color-scheme: dark)");
    this.#mql.addEventListener("change", () => this.applyTheme());
    this.applyTheme();
    this.applyZoom();
  }

  applyZoom() {
    getCurrentWebview()
      .setZoom(this.uiZoom)
      .catch(() => {}); // not under Tauri
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

  async setUiZoom(z: number) {
    this.uiZoom = clamp(Math.round(z * 100) / 100, ZOOM_MIN, ZOOM_MAX);
    this.applyZoom();
    await this.#store?.set("uiZoom", this.uiZoom);
  }

  async setEditorFontSize(px: number) {
    this.editorFontSize = clamp(Math.round(px), FONT_MIN, FONT_MAX);
    await this.#store?.set("editorFontSize", this.editorFontSize);
  }
}

export const settings = new SettingsStore();
