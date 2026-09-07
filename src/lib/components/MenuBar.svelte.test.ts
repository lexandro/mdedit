import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import MenuBar from "./MenuBar.svelte";

const props = () => ({ onCommand: vi.fn(), outlineVisible: false });
const activeRow = () => document.querySelector(".dropdown .item.active")?.textContent?.trim();

describe("MenuBar keyboard navigation", () => {
  it("opens a menu with Alt+key and moves focus off the document", async () => {
    render(MenuBar, { props: props() });

    await fireEvent.keyDown(window, { key: "v", altKey: true });

    expect(screen.queryByText("Source")).not.toBeNull();
    // The bug: without this the arrow keys reach CodeMirror and move the caret.
    expect(document.activeElement).toBe(document.querySelector(".dropdown"));
  });

  it("walks the rows with the arrow keys and runs the row on Enter", async () => {
    const p = props();
    render(MenuBar, { props: p });

    await fireEvent.keyDown(window, { key: "v", altKey: true });
    await fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(activeRow()).toContain("Source");
    await fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(activeRow()).toContain("Split");
    await fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(activeRow()).toContain("Source");

    await fireEvent.keyDown(window, { key: "Enter" });
    expect(p.onCommand).toHaveBeenCalledWith("view_source");
    expect(screen.queryByText("Split")).toBeNull(); // menu closed
  });

  it("skips separators and wraps at the ends", async () => {
    render(MenuBar, { props: props() });

    await fireEvent.keyDown(window, { key: "v", altKey: true });
    await fireEvent.keyDown(window, { key: "ArrowUp" }); // last row
    expect(activeRow()).toContain("Settings");
    await fireEvent.keyDown(window, { key: "ArrowDown" }); // wraps past the separator
    expect(activeRow()).toContain("Source");
  });

  it("moves between menus with left/right", async () => {
    render(MenuBar, { props: props() });

    await fireEvent.keyDown(window, { key: "v", altKey: true });
    await fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.queryByText("About mdedit")).not.toBeNull(); // Help
    await fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.queryByText("Source")).not.toBeNull(); // back to View
  });

  it("jumps to a row by its first letter", async () => {
    render(MenuBar, { props: props() });

    await fireEvent.keyDown(window, { key: "v", altKey: true });
    await fireEvent.keyDown(window, { key: "l" });
    expect(activeRow()).toContain("Live");
  });

  it("opens a submenu with right and closes it with left", async () => {
    render(MenuBar, { props: props() });

    await fireEvent.keyDown(window, { key: "f", altKey: true });
    for (const _ of [0, 1, 2, 3]) await fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(activeRow()).toContain("Open Recent");

    await fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.queryByText("(no recent files)")).not.toBeNull();
    await fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.queryByText("(no recent files)")).toBeNull();
  });

  it("closes on Escape", async () => {
    render(MenuBar, { props: props() });

    await fireEvent.keyDown(window, { key: "v", altKey: true });
    await fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByText("Source")).toBeNull();
  });
});
