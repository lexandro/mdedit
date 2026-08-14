import { describe, it, expect, afterEach } from "vitest";
import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { EditorView } from "@codemirror/view";
import Editor from "./Editor.svelte";
import { tabs } from "$lib/stores/tabs.svelte";

const tab = {
  id: 999,
  path: null,
  content: "",
  savedContent: "",
  viewMode: "split" as const,
  lineEnding: "lf" as const,
  encoding: "utf-8" as const,
};

afterEach(() => {
  tabs.activeId = null;
});

describe("Editor focus on mount", () => {
  it("focuses the editor when it is the active tab (new-tab UX)", async () => {
    tabs.activeId = tab.id;
    const { container } = render(Editor, { props: { tab } });
    await tick();
    expect(container.querySelector(".cm-content")).toBe(document.activeElement);
  });

  it("does not focus when it is not the active tab", async () => {
    tabs.activeId = 12345;
    const { container } = render(Editor, { props: { tab } });
    await tick();
    expect(container.querySelector(".cm-content")).not.toBe(document.activeElement);
  });
});

// A file reloaded underneath the editor (auto-reload, or an accepted prompt)
// replaces the whole document, which maps the cursor to offset 0 unless we
// carry it over — the reader would be thrown back to the top on every write.
describe("external content updates", () => {
  const doc = "line1\nline2\nline3\nline4\n";

  it("keeps the cursor where it was", async () => {
    const t0 = { ...tab, content: doc, savedContent: doc };
    const { container, rerender } = render(Editor, { props: { tab: t0 } });
    await tick();
    const view = EditorView.findFromDOM(container.querySelector(".cm-editor")!)!;
    view.dispatch({ selection: { anchor: 14 } }); // inside line3

    const grown = doc + "line5\n";
    await rerender({ tab: { ...t0, content: grown, savedContent: grown } });
    await tick();

    expect(view.state.doc.toString()).toBe(grown);
    expect(view.state.selection.main.head).toBe(14);
  });

  it("clamps the cursor when the file shrinks", async () => {
    const t0 = { ...tab, content: doc, savedContent: doc };
    const { container, rerender } = render(Editor, { props: { tab: t0 } });
    await tick();
    const view = EditorView.findFromDOM(container.querySelector(".cm-editor")!)!;
    view.dispatch({ selection: { anchor: 20 } });

    await rerender({ tab: { ...t0, content: "hi", savedContent: "hi" } });
    await tick();

    expect(view.state.selection.main.head).toBe(2);
  });
});
