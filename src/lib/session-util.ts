// Pure serialization of the open tabs into the persisted session shape. Kept
// Tauri/runes-free (type-only imports) so it is unit-testable. The dirty check
// is inlined (content !== savedContent) to avoid a runtime dependency.
import type { Encoding, LineEnding } from "$lib/encoding";
import type { ViewMode } from "$lib/stores/settings.svelte";
import type { SessionData } from "$lib/stores/tabs.svelte";

interface TabLike {
  id: number;
  path: string | null;
  content: string;
  savedContent: string;
  viewMode: ViewMode;
  lineEnding: LineEnding;
  encoding: Encoding;
}

/** Build the persisted session: keep each tab's buffer only when it is dirty or
 *  untitled; drop empty untitled tabs entirely. */
export function serializeSession(tabs: TabLike[], activeId: number | null): SessionData {
  return {
    activeIndex: tabs.findIndex((t) => t.id === activeId),
    tabs: tabs
      .filter((t) => t.path || t.content !== "")
      .map((t) => {
        const keepBuffer = t.content !== t.savedContent || !t.path;
        return {
          path: t.path,
          viewMode: t.viewMode,
          lineEnding: t.lineEnding,
          encoding: t.encoding,
          ...(keepBuffer ? { unsaved: t.content } : {}),
        };
      }),
  };
}
