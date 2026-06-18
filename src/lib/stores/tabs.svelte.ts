// Open-document model. Each tab owns its own buffer, file path, view mode and
// line-ending metadata. Dirty state is derived: content !== savedContent.
import { confirm } from "@tauri-apps/plugin-dialog";
import {
  pickAndReadFile,
  pickSavePath,
  readFile,
  samePath,
  revealInDir,
  unwatchFile,
  watchFile,
  writeFile,
  type LineEnding,
  type Encoding,
} from "$lib/ipc";
import { moveItem } from "$lib/array-util";
import { settings, type ViewMode } from "$lib/stores/settings.svelte";
import { recent } from "$lib/stores/recent.svelte";
import { toasts } from "$lib/stores/toasts.svelte";

export interface Tab {
  id: number;
  path: string | null;
  content: string;
  savedContent: string;
  viewMode: ViewMode;
  lineEnding: LineEnding;
  encoding: Encoding;
}

/** One persisted tab. `unsaved` is the live buffer, kept only for dirty/untitled
 *  tabs so unsaved work survives a restart; clean files are re-read from disk. */
export interface SessionTabData {
  path: string | null;
  viewMode: ViewMode;
  lineEnding: LineEnding;
  encoding: Encoding;
  unsaved?: string;
}

export interface SessionData {
  tabs: SessionTabData[];
  activeIndex: number;
}

let nextId = 1;

export function basename(path: string): string {
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

  #makeTab(partial: Partial<Tab>): Tab {
    return {
      id: nextId++,
      path: null,
      content: "",
      savedContent: "",
      viewMode: settings.defaultViewMode,
      lineEnding: "lf",
      encoding: "utf-8",
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
    try {
      const loaded = await pickAndReadFile();
      if (loaded) this.#openLoaded(loaded);
    } catch (e) {
      toasts.error("Couldn't open file", e);
    }
  }

  /** Open a known path directly (e.g. from the recent-files list). */
  async openPath(path: string) {
    try {
      this.#openLoaded(await readFile(path));
    } catch (e) {
      toasts.error(`Couldn't open ${basename(path)}`, e);
    }
  }

  #openLoaded(loaded: { path: string; content: string; lineEnding: LineEnding; encoding: Encoding }) {
    const existing = this.tabs.find((t) => t.path && samePath(t.path, loaded.path));
    if (existing) {
      this.activeId = existing.id;
      return;
    }
    const tab = this.#makeTab({
      path: loaded.path,
      content: loaded.content,
      savedContent: loaded.content,
      lineEnding: loaded.lineEnding,
      encoding: loaded.encoding,
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
          encoding: desc.encoding,
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
            encoding: loaded.encoding,
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
    if (!(await this.#confirm(msg, "File changed on disk"))) return;

    tab.content = loaded.content;
    tab.savedContent = loaded.content;
    tab.lineEnding = loaded.lineEnding;
    tab.encoding = loaded.encoding;
  }

  // Windows-1250 is read-only; saving such a buffer writes (and relabels) UTF-8.
  #writeEncoding(tab: Tab): Encoding {
    return tab.encoding === "windows-1250" ? "utf-8" : tab.encoding;
  }

  /** Native confirm dialog, falling back to the web one outside Tauri. */
  async #confirm(message: string, title: string): Promise<boolean> {
    try {
      return await confirm(message, { title, kind: "warning" });
    } catch {
      return window.confirm(message);
    }
  }

  /** Save active/given tab. Returns true on success, false if cancelled. */
  async save(id?: number): Promise<boolean> {
    const tab = id != null ? this.tabs.find((t) => t.id === id) : this.active;
    if (!tab) return false;
    if (!tab.path) return this.saveAs(tab.id);
    const encoding = this.#writeEncoding(tab);
    try {
      await writeFile(tab.path, tab.content, { lineEnding: tab.lineEnding, encoding });
    } catch (e) {
      toasts.error(`Couldn't save ${tabTitle(tab)}`, e);
      return false;
    }
    tab.encoding = encoding;
    tab.savedContent = tab.content;
    return true;
  }

  async saveAs(id?: number): Promise<boolean> {
    const tab = id != null ? this.tabs.find((t) => t.id === id) : this.active;
    if (!tab) return false;
    const suggested = tab.path ? basename(tab.path) : `${tabTitle(tab)}.md`;
    const path = await pickSavePath(suggested);
    if (!path) return false;
    const encoding = this.#writeEncoding(tab);
    try {
      await writeFile(path, tab.content, { lineEnding: tab.lineEnding, encoding });
    } catch (e) {
      toasts.error(`Couldn't save ${basename(path)}`, e);
      return false;
    }
    tab.encoding = encoding;
    tab.path = path;
    tab.savedContent = tab.content;
    void recent.add(path);
    void watchFile(path);
    return true;
  }

  /** Save every tab with unsaved changes. */
  async saveAll() {
    for (const t of this.tabs) {
      if (isDirty(t)) await this.save(t.id);
    }
  }

  // Stack of recently closed tabs, for reopen (most-recent last).
  #closed: Array<Omit<Tab, "id">> = [];

  /** Remove a tab unconditionally (no prompt). */
  close(id: number) {
    const idx = this.tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const closing = this.tabs[idx];
    // Remember it for "reopen closed tab" (skip blank untitled buffers).
    if (closing.path || closing.content !== "") {
      const { id: _id, ...rest } = closing;
      this.#closed.push({ ...rest });
      if (this.#closed.length > 25) this.#closed.shift();
    }
    // Stop watching unless another tab still has the same file open.
    if (
      closing.path &&
      !this.tabs.some((t) => t.id !== id && t.path && samePath(t.path, closing.path!))
    ) {
      void unwatchFile(closing.path);
    }
    this.tabs.splice(idx, 1);
    if (this.activeId === id) {
      const next = this.tabs[idx] ?? this.tabs[idx - 1] ?? null;
      this.activeId = next?.id ?? null;
    }
  }

  /** Reopen the most recently closed tab, restoring its buffer and view mode. */
  reopenClosed() {
    const restored = this.#closed.pop();
    if (!restored) return;
    const tab = this.#makeTab({ ...restored });
    this.tabs.push(tab);
    this.activeId = tab.id;
    if (tab.path) void watchFile(tab.path);
  }

  /** Close a tab, prompting if it has unsaved changes. */
  async closeWithConfirm(id: number) {
    const tab = this.tabs.find((t) => t.id === id);
    if (!tab) return;
    if (isDirty(tab)) {
      const msg = `Discard unsaved changes to "${tabTitle(tab)}"?`;
      if (!(await this.#confirm(msg, "Unsaved changes"))) return;
    }
    this.close(id);
  }

  /** Close every tab except the given one (prompting per dirty tab). */
  async closeOthers(id: number) {
    for (const t of this.tabs.filter((t) => t.id !== id)) await this.closeWithConfirm(t.id);
  }

  /** Close every tab to the right of the given one. */
  async closeToRight(id: number) {
    const idx = this.tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;
    for (const t of this.tabs.slice(idx + 1)) await this.closeWithConfirm(t.id);
  }

  /** Reorder tabs (drag-and-drop). */
  moveTab(from: number, to: number) {
    this.tabs = moveItem(this.tabs, from, to);
  }

  /** Copy a tab's full file path to the clipboard. */
  async copyPath(id: number) {
    const tab = this.tabs.find((t) => t.id === id);
    if (!tab?.path) return;
    try {
      await navigator.clipboard.writeText(tab.path);
      toasts.success("Path copied");
    } catch (e) {
      toasts.error("Couldn't copy path", e);
    }
  }

  /** Reveal a tab's file in the OS file manager. */
  async revealInExplorer(id: number) {
    const tab = this.tabs.find((t) => t.id === id);
    if (tab?.path) await revealInDir(tab.path);
  }
}

export const tabs = new TabsStore();
