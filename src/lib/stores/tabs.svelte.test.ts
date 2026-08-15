import { describe, it, expect, beforeEach, vi } from "vitest";
import { tabs } from "./tabs.svelte";
import { settings } from "./settings.svelte";
import type { ConfirmRequest } from "./confirm.svelte";

const readFile = vi.fn();
const ask = vi.fn<(req: ConfirmRequest) => Promise<unknown>>();

vi.mock("$lib/ipc", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/ipc")>()),
  readFile: (path: string) => readFile(path),
  watchFile: vi.fn(),
  unwatchFile: vi.fn(),
}));

vi.mock("$lib/stores/confirm.svelte", () => ({
  confirmDialog: { ask: (req: ConfirmRequest) => ask(req) },
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  confirm: vi.fn(),
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
  ask.mockReset();
  ask.mockResolvedValue({ confirmed: true, checked: false });
  settings.autoReload = false;
});

describe("external file changes", () => {
  it("asks before reloading by default", async () => {
    openTab("old");
    await externalChange("new");
    expect(ask).toHaveBeenCalledTimes(1);
    expect(tabs.tabs[0].content).toBe("new");
  });

  it("keeps the buffer when the prompt is declined", async () => {
    ask.mockResolvedValue({ confirmed: false, checked: false });
    openTab("old");
    await externalChange("new");
    expect(tabs.tabs[0].content).toBe("old");
  });

  it("reloads silently with auto-reload on and a clean buffer", async () => {
    settings.autoReload = true;
    openTab("old");
    await externalChange("new");
    expect(ask).not.toHaveBeenCalled();
    expect(tabs.tabs[0].content).toBe("new");
    expect(tabs.tabs[0].savedContent).toBe("new");
  });

  // Auto-reload must never be a data-loss switch.
  it("still asks when the buffer has unsaved edits", async () => {
    settings.autoReload = true;
    openTab("my unsaved work", "old");
    ask.mockResolvedValue({ confirmed: false, checked: false });
    await externalChange("new");
    expect(ask).toHaveBeenCalledTimes(1);
    expect(tabs.tabs[0].content).toBe("my unsaved work");
  });

  it("ignores an event whose content matches what we last saved", async () => {
    settings.autoReload = true;
    openTab("same");
    await externalChange("same");
    expect(ask).not.toHaveBeenCalled();
  });
});

describe('external file changes — "don\'t ask again"', () => {
  it("turns auto-reload on when the option is ticked and confirmed", async () => {
    ask.mockResolvedValue({ confirmed: true, checked: true });
    openTab("old");
    await externalChange("new");
    expect(settings.autoReload).toBe(true);
    expect(tabs.tabs[0].content).toBe("new");
  });

  it("leaves auto-reload off when the prompt is cancelled", async () => {
    ask.mockResolvedValue({ confirmed: false, checked: true });
    openTab("old");
    await externalChange("new");
    expect(settings.autoReload).toBe(false);
    expect(tabs.tabs[0].content).toBe("old");
  });

  it("offers the option only for a clean buffer", async () => {
    openTab("old");
    await externalChange("new");
    expect(ask.mock.calls[0][0].optionLabel).toBeTruthy();

    ask.mockReset();
    ask.mockResolvedValue({ confirmed: false, checked: false });
    openTab("my unsaved work", "old");
    await externalChange("new");
    expect(ask.mock.calls[0][0].optionLabel).toBeUndefined();
  });
});
