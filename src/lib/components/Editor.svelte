<script lang="ts">
  import { onMount } from "svelte";
  import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
  import { EditorState, Compartment } from "@codemirror/state";
  import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
  import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
  import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
  import { markdown } from "@codemirror/lang-markdown";
  import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
  import { oneDark } from "@codemirror/theme-one-dark";
  import { tabs, type Tab } from "$lib/stores/tabs.svelte";
  import { settings } from "$lib/stores/settings.svelte";
  import { setActiveEditor, clearActiveEditor, editorCommands } from "$lib/editor-commands";
  import { editorStatus } from "$lib/stores/editor-status.svelte";
  import { wrapSelection, insertLink, continueList } from "$lib/md-format";
  import { linkFromPaste } from "$lib/md-format-core";
  import { savePastedImage } from "$lib/paste-image";
  import { fontSizeForWheel } from "$lib/settings-util";
  import { toasts } from "$lib/stores/toasts.svelte";
  import { t } from "$lib/i18n";

  let {
    tab,
    onScroll,
    scrollFraction,
  }: {
    tab: Tab;
    onScroll?: (fraction: number) => void;
    scrollFraction?: number;
  } = $props();

  let host: HTMLDivElement;
  let view: EditorView | undefined;
  const themeCompartment = new Compartment();
  const wrapCompartment = new Compartment();

  // Report the cursor position to the status bar (only for the active tab).
  function reportCursor(v: EditorView) {
    if (tab.id !== tabs.activeId) return;
    const head = v.state.selection.main.head;
    const line = v.state.doc.lineAt(head);
    editorStatus.set(line.number, head - line.from + 1);
  }

  // Last fraction we programmatically applied, to suppress the echo scroll event.
  let appliedFraction = -1;

  // Intercept image pastes: save the image and insert a Markdown link instead
  // of the (unsupported) raw image data. Text pastes fall through to CodeMirror.
  function handlePaste(event: ClipboardEvent, v: EditorView): boolean {
    const file = Array.from(event.clipboardData?.items ?? [])
      .find((it) => it.type.startsWith("image/"))
      ?.getAsFile();
    if (file) {
      event.preventDefault();
      void (async () => {
        const src = await savePastedImage(file, tab.path);
        if (!src) {
          toasts.error(t("toast.pasteImageFail"));
          return;
        }
        insertAtSelection(v, `![](${src})`);
      })();
      return true;
    }
    // Pasting a URL over a selection turns it into a Markdown link.
    const { from, to } = v.state.selection.main;
    const link = linkFromPaste(
      v.state.sliceDoc(from, to),
      event.clipboardData?.getData("text/plain") ?? "",
    );
    if (link) {
      event.preventDefault();
      insertAtSelection(v, link);
      return true;
    }
    return false;
  }

  function insertAtSelection(v: EditorView, text: string) {
    const { from, to } = v.state.selection.main;
    v.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } });
  }

  // Custom right-click menu (the WebView's default menu is the browser one).
  let ctxMenu = $state<{ x: number; y: number } | null>(null);
  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    view?.focus();
    ctxMenu = { x: e.clientX, y: e.clientY };
  }
  function runCtx(action: () => void) {
    ctxMenu = null;
    action();
  }

  // Ctrl + mouse wheel zooms the editor font (like Notepad), overriding the
  // WebView's default page zoom.
  function handleWheel(e: WheelEvent) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    void settings.setEditorFontSize(fontSizeForWheel(settings.editorFontSize, e.deltaY));
  }

  function handleScroll() {
    if (!view || !onScroll) return;
    const el = view.scrollDOM;
    const max = el.scrollHeight - el.clientHeight;
    const cur = max > 0 ? el.scrollTop / max : 0;
    if (Math.abs(cur - appliedFraction) < 0.004) return; // echo from sync
    onScroll(cur);
  }

  function themeExtension() {
    return settings.resolvedTheme === "dark"
      ? oneDark
      : syntaxHighlighting(defaultHighlightStyle, { fallback: true });
  }

  onMount(() => {
    view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: tab.content,
        extensions: [
          lineNumbers(),
          history(),
          highlightActiveLine(),
          highlightSelectionMatches(),
          closeBrackets(),
          wrapCompartment.of(settings.wordWrap ? EditorView.lineWrapping : []),
          markdown(),
          EditorView.domEventHandlers({ paste: handlePaste }),
          themeCompartment.of(themeExtension()),
          keymap.of([
            { key: "Enter", run: continueList },
            { key: "Mod-b", run: (v) => wrapSelection(v, "**") },
            { key: "Mod-i", run: (v) => wrapSelection(v, "*") },
            { key: "Mod-k", run: insertLink },
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...searchKeymap,
            indentWithTab,
          ]),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) {
              tabs.setContent(tab.id, u.state.doc.toString());
            }
            if (u.docChanged || u.selectionSet) {
              reportCursor(u.view);
            }
          }),
        ],
      }),
    });
    view.scrollDOM.addEventListener("scroll", handleScroll, { passive: true });
    view.scrollDOM.addEventListener("wheel", handleWheel, { passive: false });
    view.scrollDOM.addEventListener("contextmenu", handleContextMenu);
    const onFocusIn = () => view && setActiveEditor(view);
    view.contentDOM.addEventListener("focusin", onFocusIn);
    return () => {
      view?.scrollDOM.removeEventListener("scroll", handleScroll);
      view?.scrollDOM.removeEventListener("wheel", handleWheel);
      view?.scrollDOM.removeEventListener("contextmenu", handleContextMenu);
      view?.contentDOM.removeEventListener("focusin", onFocusIn);
      if (view) clearActiveEditor(view);
      view?.destroy();
    };
  });

  // Make this the active editor (for Edit-menu actions) when its tab is active,
  // and refresh the status-bar cursor for the newly active tab.
  $effect(() => {
    if (view && tab.id === tabs.activeId) {
      setActiveEditor(view);
      reportCursor(view);
    }
  });

  // Toggle word wrap when the setting changes.
  $effect(() => {
    const wrap = settings.wordWrap;
    view?.dispatch({
      effects: wrapCompartment.reconfigure(wrap ? EditorView.lineWrapping : []),
    });
  });

  // Re-apply the editor theme whenever the resolved light/dark value changes.
  $effect(() => {
    const _ = settings.resolvedTheme;
    view?.dispatch({ effects: themeCompartment.reconfigure(themeExtension()) });
  });

  // Follow the preview's scroll position (driven from a split view).
  $effect(() => {
    const f = scrollFraction;
    if (!view || f == null) return;
    const max = view.scrollDOM.scrollHeight - view.scrollDOM.clientHeight;
    if (max <= 0) return;
    appliedFraction = f;
    view.scrollDOM.scrollTop = f * max;
  });

  // Push external content changes (e.g. file reload) into the editor without
  // clobbering the user's cursor during normal typing.
  $effect(() => {
    const incoming = tab.content;
    if (view && incoming !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: incoming },
      });
    }
  });

  export function focus() {
    view?.focus();
  }
</script>

<div class="editor" bind:this={host} style="--editor-font-size: {settings.editorFontSize}px"></div>

{#if ctxMenu}
  <div
    class="ctx-backdrop"
    role="presentation"
    onpointerdown={() => (ctxMenu = null)}
    oncontextmenu={(e) => {
      e.preventDefault();
      ctxMenu = null;
    }}
  ></div>
  <div class="ctx-menu" style="left: {ctxMenu.x}px; top: {ctxMenu.y}px" role="menu">
    <button role="menuitem" onclick={() => runCtx(editorCommands.cut)}>{t("cmd.cut")}</button>
    <button role="menuitem" onclick={() => runCtx(editorCommands.copy)}>{t("cmd.copy")}</button>
    <button role="menuitem" onclick={() => runCtx(() => void editorCommands.paste())}
      >{t("cmd.paste")}</button
    >
    <div class="ctx-sep" role="separator"></div>
    <button role="menuitem" onclick={() => runCtx(editorCommands.selectAll)}
      >{t("cmd.select_all")}</button
    >
  </div>
{/if}

<style>
  .editor {
    height: 100%;
    overflow: hidden;
  }
  .ctx-backdrop {
    position: fixed;
    inset: 0;
    z-index: 30;
  }
  .ctx-menu {
    position: fixed;
    z-index: 31;
    min-width: 160px;
    padding: 4px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
  }
  .ctx-menu button {
    display: block;
    width: 100%;
    text-align: left;
    border: none;
    background: transparent;
    color: var(--fg);
    padding: 6px 10px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 13px;
  }
  .ctx-menu button:hover {
    background: var(--accent);
    color: var(--accent-fg);
  }
  .ctx-sep {
    height: 1px;
    background: var(--border);
    margin: 4px 6px;
  }
  .editor :global(.cm-editor) {
    height: 100%;
  }
  .editor :global(.cm-scroller) {
    font-family: var(--mono-font);
    font-size: var(--editor-font-size, 14px);
  }
</style>
