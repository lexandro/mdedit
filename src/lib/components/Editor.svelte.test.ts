import { describe, it, expect, afterEach } from "vitest";
import { render } from "@testing-library/svelte";
import { tick } from "svelte";
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
