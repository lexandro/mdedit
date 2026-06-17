<script lang="ts">
  import { onMount } from "svelte";
  import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
  import { EditorState, Compartment } from "@codemirror/state";
  import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
  import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
  import { markdown } from "@codemirror/lang-markdown";
  import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
  import { oneDark } from "@codemirror/theme-one-dark";
  import { tabs, type Tab } from "$lib/stores/tabs.svelte";
  import { settings } from "$lib/stores/settings.svelte";

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

  // Last fraction we programmatically applied, to suppress the echo scroll event.
  let appliedFraction = -1;

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
          EditorView.lineWrapping,
          markdown(),
          themeCompartment.of(themeExtension()),
          keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) {
              tabs.setContent(tab.id, u.state.doc.toString());
            }
          }),
        ],
      }),
    });
    view.scrollDOM.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      view?.scrollDOM.removeEventListener("scroll", handleScroll);
      view?.destroy();
    };
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

<style>
  .editor {
    height: 100%;
    overflow: hidden;
  }
  .editor :global(.cm-editor) {
    height: 100%;
  }
  .editor :global(.cm-scroller) {
    font-family: var(--mono-font);
    font-size: var(--editor-font-size, 14px);
  }
</style>
