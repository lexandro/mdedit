// Open-document model. Each tab owns its own buffer, file path, view mode and
// line-ending metadata. Dirty state is derived: content !== savedContent.
import { confirm } from "@tauri-apps/plugin-dialog";
import {
  pickAndReadFile,
  pickSavePath,
  readFile,
  samePath,
  unwatchFile,
  watchFile,
  writeFile,
  type LineEnding,
} from "$lib/ipc";
import { settings, type ViewMode } from "$lib/stores/settings.svelte";
import { recent } from "$lib/stores/recent.svelte";

export interface Tab {
  id: number;
  path: string | null;
  content: string;
  savedContent: string;
  viewMode: ViewMode;
  lineEnding: LineEnding;
  hadBom: boolean;
}

/** One persisted tab. `unsaved` is the live buffer, kept only for dirty/untitled
 *  tabs so unsaved work survives a restart; clean files are re-read from disk. */
export interface SessionTabData {
  path: string | null;
  viewMode: ViewMode;
  lineEnding: LineEnding;
  hadBom: boolean;
  unsaved?: string;
}

export interface SessionData {
  tabs: SessionTabData[];
  activeIndex: number;
}

let nextId = 1;

function basename(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

export function tabTitle(tab: Tab): string {
  return tab.path ? basename(tab.path) : `Untitled-${tab.id}`;
}

export function isDirty(tab: Tab): boolean {
  return tab.content !== tab.savedContent;
}

class TabsStore {
  tabs = $state<Tab[]>([]);
  activeId = $state<number | null>(null);

  active = $derived(this.tabs.find((t) => t.id === this.activeId) ?? null);
  anyDirty = $derived(this.tabs.some(isDirty));

  #makeTab(partial: Partial<Tab>): Tab {
    return {
      id: nextId++,
      path: null,
      content: "",
      savedContent: "",
      viewMode: settings.defaultViewMode,
      lineEnding: "lf",
      hadBom: false,
      ...partial,
    };
  }

  newTab() {
    const tab = this.#makeTab({});
    this.tabs.push(tab);
    this.activeId = tab.id;
  }

  select(id: number) {
    this.activeId = id;
  }

  setContent(id: number, content: string) {
    const tab = this.tabs.find((t) => t.id === id);
    if (tab) tab.content = content;
  }

  setViewMode(id: number, mode: ViewMode) {
    const tab = this.tabs.find((t) => t.id === id);
    if (tab) tab.viewMode = mode;
  }

  setLineEnding(id: number, lineEnding: LineEnding) {
    const tab = this.tabs.find((t) => t.id === id);
    if (tab) tab.lineEnding = lineEnding;
  }

  /** Open via dialog. If the file is already open, just focus its tab. */
  async open() {
    const loaded = await pickAndReadFile();
    if (!loaded) return;
    this.#openLoaded(loaded);
  }

  /** Open a known path directly (e.g. from the recent-files list). */
  async openPath(path: string) {
    const existing = this.tabs.find((t) => t.path === path);
    if (existing) {
      this.activeId = existing.id;
      return;
    }
    const loaded = await readFile(path);
    this.#openLoaded(loaded);
  }

  #openLoaded(loaded: { path: string; content: string; lineEnding: LineEnding; hadBom: boolean }) {
    const existing = this.tabs.find((t) => t.path === loaded.path);
    if (existing) {
      this.activeId = existing.id;
      return;
    }
    const tab = this.#makeTab({
      path: loaded.path,
      content: loaded.content,
      savedContent: loaded.content,
      lineEnding: loaded.lineEnding,
      hadBom: loaded.hadBom,
    });
    this.tabs.push(tab);
    this.activeId = tab.id;
    void recent.add(loaded.path);
    void watchFile(loaded.path);
  }

  /** Recreate tabs from a persisted session (startup restore). */
  async applySession(data: SessionData) {
    for (const desc of data.tabs) {
      if (desc.unsaved != null) {
        // Dirty or untitled buffer: restore the live text. For path-backed
        // tabs, read disk so the dirty state reflects the real on-disk content.
        let saved = "";
        if (desc.path) {
          try {
            saved = (await readFile(desc.path)).content;
          } catch {
            saved = ""; // file gone/locked — treat the buffer as fully unsaved
          }
        }
        const tab = this.#makeTab({
          path: desc.path,
          content: desc.unsaved,
          savedContent: saved,
          viewMode: desc.viewMode,
          lineEnding: desc.lineEnding,
          hadBom: desc.hadBom,
        });
        this.tabs.push(tab);
        if (desc.path) void watchFile(desc.path);
      } else if (desc.path) {
        // Clean saved file: re-read from disk.
        try {
          const loaded = await readFile(desc.path);
          const tab = this.#makeTab({
            path: loaded.path,
            content: loaded.content,
            savedContent: loaded.content,
            viewMode: desc.viewMode,
            lineEnding: loaded.lineEnding,
            hadBom: loaded.hadBom,
          });
          this.tabs.push(tab);
          void watchFile(loaded.path);
        } catch {
          // File no longer exists — skip it.
        }
      }
    }
    const active = this.tabs[data.activeIndex] ?? this.tabs[this.tabs.length - 1] ?? null;
    this.activeId = active?.id ?? null;
  }

  // Coalesce bursty filesystem events per path.
  #pendingChanges = new Set<string>();

  /** React to an external on-disk change for an open file. */
  async handleExternalChange(changedPath: string) {
    const tab = this.tabs.find((t) => t.path && samePath(t.path, changedPath));
    if (!tab?.path || this.#pendingChanges.has(tab.path)) return;
    this.#pendingChanges.add(tab.path);
    setTimeout(() => this.#applyExternalChange(tab.id), 200);
  }

  async #applyExternalChange(id: number) {
    const tab = this.tabs.find((t) => t.id === id);
    if (!tab?.path) return;
    this.#pendingChanges.delete(tab.path);
    let loaded;
    try {
      loaded = await readFile(tab.path);
    } catch {
      return; // file removed / temporarily locked
    }
    if (loaded.content === tab.savedContent) return; // no real change (e.g. our own save)

    // Notepad++-style: notice the external edit and offer to reload.
    const name = tabTitle(tab);
    const msg = isDirty(tab)
      ? `"${name}" was modified by another program.\nReload and discard your unsaved changes?`
      : `"${name}" was modified by another program.\nReload it?`;
    let ok = false;
    try {
      ok = await confirm(msg, { title: "File changed on disk", kind: "warning" });
    } catch {
      ok = window.confirm(msg);
    }
    if (!ok) return;

    tab.content = loaded.content;
    tab.savedContent = loaded.content;
    tab.lineEnding = loaded.lineEnding;
    tab.hadBom = loaded.hadBom;
  }

  /** Reload a tab's content from disk (used after external change). */
  async reload(id: number) {
    const tab = this.tabs.find((t) => t.id === id);
    if (!tab?.path) return;
    const loaded = await readFile(tab.path);
    tab.content = loaded.content;
    tab.savedContent = loaded.content;
    tab.lineEnding = loaded.lineEnding;
    tab.hadBom = loaded.hadBom;
  }

  /** Save active/given tab. Returns true on success, false if cancelled. */
  async save(id?: number): Promise<boolean> {
    const tab = id != null ? this.tabs.find((t) => t.id === id) : this.active;
    if (!tab) return false;
    if (!tab.path) return this.saveAs(tab.id);
    await writeFile(tab.path, tab.content, { lineEnding: tab.lineEnding, bom: tab.hadBom });
    tab.savedContent = tab.content;
    return true;
  }

  async saveAs(id?: number): Promise<boolean> {
    const tab = id != null ? this.tabs.find((t) => t.id === id) : this.active;
    if (!tab) return false;
    const suggested = tab.path ? basename(tab.path) : `${tabTitle(tab)}.md`;
    const path = await pickSavePath(suggested);
    if (!path) return false;
    await writeFile(path, tab.content, { lineEnding: tab.lineEnding, bom: tab.hadBom });
    tab.path = path;
    tab.savedContent = tab.content;
    void recent.add(path);
    void watchFile(path);
    return true;
  }

  /** Remove a tab unconditionally (no prompt). */
  close(id: number) {
    const idx = this.tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const closing = this.tabs[idx];
    // Stop watching unless another tab still has the same file open.
    if (closing.path && !this.tabs.some((t) => t.id !== id && t.path === closing.path)) {
      void unwatchFile(closing.path);
    }
    this.tabs.splice(idx, 1);
    if (this.activeId === id) {
      const next = this.tabs[idx] ?? this.tabs[idx - 1] ?? null;
      this.activeId = next?.id ?? null;
    }
  }

  /** Close a tab, prompting if it has unsaved changes. */
  async closeWithConfirm(id: number) {
    const tab = this.tabs.find((t) => t.id === id);
    if (!tab) return;
    if (isDirty(tab)) {
      const msg = `Discard unsaved changes to "${tabTitle(tab)}"?`;
      let ok = true;
      try {
        ok = await confirm(msg, { title: "Unsaved changes", kind: "warning" });
      } catch {
        ok = window.confirm(msg);
      }
      if (!ok) return;
    }
    this.close(id);
  }
}

export const tabs = new TabsStore();
