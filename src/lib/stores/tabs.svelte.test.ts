import { describe, it, expect, beforeEach, vi } from "vitest";
import { tabs } from "./tabs.svelte";
import { settings } from "./settings.svelte";

const readFile = vi.fn();
const confirm = vi.fn();

vi.mock("$lib/ipc", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/ipc")>()),
  readFile: (path: string) => readFile(path),
  watchFile: vi.fn(),
  unwatchFile: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  confirm: (...args: unknown[]) => confirm(...args),
  open: vi.fn(),
  save: vi.fn(),
}));

const PATH = "C:/docs/note.md";

function openTab(content: string, saved = content) {
  tabs.tabs = [
    {
      id: 1,
      path: PATH,
      content,
      savedContent: saved,
      viewMode: "split",
      lineEnding: "lf",
      encoding: "utf-8",
    },
  ];
  tabs.activeId = 1;
}

/** Trigger the watcher and wait out the 200 ms coalescing window. */
async function externalChange(newContent: string) {
  readFile.mockResolvedValue({
    path: PATH,
    content: newContent,
    lineEnding: "lf",
    encoding: "utf-8",
  });
  await tabs.handleExternalChange(PATH);
  await new Promise((r) => setTimeout(r, 260));
}

beforeEach(() => {
  readFile.mockReset();
  confirm.mockReset();
  confirm.mockResolvedValue(true);
  settings.autoReload = false;
});

describe("external file changes", () => {
  it("asks before reloading by default", async () => {
    openTab("old");
    await externalChange("new");
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(tabs.tabs[0].content).toBe("new");
  });

  it("keeps the buffer when the prompt is declined", async () => {
    confirm.mockResolvedValue(false);
    openTab("old");
    await externalChange("new");
    expect(tabs.tabs[0].content).toBe("old");
  });

  it("reloads silently with auto-reload on and a clean buffer", async () => {
    settings.autoReload = true;
    openTab("old");
    await externalChange("new");
    expect(confirm).not.toHaveBeenCalled();
    expect(tabs.tabs[0].content).toBe("new");
    expect(tabs.tabs[0].savedContent).toBe("new");
  });

  // Auto-reload must never be a data-loss switch.
  it("still asks when the buffer has unsaved edits", async () => {
    settings.autoReload = true;
    openTab("my unsaved work", "old");
    confirm.mockResolvedValue(false);
    await externalChange("new");
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(tabs.tabs[0].content).toBe("my unsaved work");
  });

  it("ignores an event whose content matches what we last saved", async () => {
    settings.autoReload = true;
    openTab("same");
    await externalChange("same");
    expect(confirm).not.toHaveBeenCalled();
  });
});
