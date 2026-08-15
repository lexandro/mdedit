import { describe, it, expect, beforeEach, vi } from "vitest";
import { tabs } from "./tabs.svelte";
import { settings } from "./settings.svelte";
import type { ConfirmRequest } from "./confirm.svelte";

const readFile = vi.fn();
const writeFile = vi.fn();
const pathExists = vi.fn();
const ask = vi.fn<(req: ConfirmRequest) => Promise<unknown>>();

vi.mock("$lib/ipc", async (importOriginal) => ({
  ...(await importOriginal<typeof import("$lib/ipc")>()),
  readFile: (path: string) => readFile(path),
  writeFile: (...args: unknown[]) => writeFile(...args),
  pathExists: (path: string) => pathExists(path),
  watchFile: vi.fn(),
  unwatchFile: vi.fn(),
}));

vi.mock("$lib/stores/confirm.svelte", () => ({
  confirmDialog: { ask: (req: ConfirmRequest) => ask(req) },
}));

// ipc.ts (partially imported above) still pulls in the file pickers.
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: vi.fn(), save: vi.fn() }));

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
  writeFile.mockReset();
  writeFile.mockResolvedValue(undefined);
  pathExists.mockReset();
  ask.mockReset();
  ask.mockResolvedValue({ choice: "confirm", checked: false });
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
    ask.mockResolvedValue({ choice: "cancel", checked: false });
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
    ask.mockResolvedValue({ choice: "cancel", checked: false });
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
    ask.mockResolvedValue({ choice: "confirm", checked: true });
    openTab("old");
    await externalChange("new");
    expect(settings.autoReload).toBe(true);
    expect(tabs.tabs[0].content).toBe("new");
  });

  it("leaves auto-reload off when the prompt is cancelled", async () => {
    ask.mockResolvedValue({ choice: "cancel", checked: true });
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
    ask.mockResolvedValue({ choice: "cancel", checked: false });
    openTab("my unsaved work", "old");
    await externalChange("new");
    expect(ask.mock.calls[0][0].optionLabel).toBeUndefined();
  });
});

describe("closing a tab with unsaved changes", () => {
  it("closes without asking when the buffer is clean", async () => {
    openTab("same");
    await tabs.closeWithConfirm(1);
    expect(ask).not.toHaveBeenCalled();
    expect(tabs.tabs).toHaveLength(0);
  });

  it("saves and closes when the prompt is confirmed", async () => {
    ask.mockResolvedValue({ choice: "confirm", checked: false });
    openTab("edited", "old");
    await tabs.closeWithConfirm(1);
    expect(writeFile).toHaveBeenCalledWith(PATH, "edited", expect.anything());
    expect(tabs.tabs).toHaveLength(0);
  });

  it("closes without writing when the user declines to save", async () => {
    ask.mockResolvedValue({ choice: "alt", checked: false });
    openTab("edited", "old");
    await tabs.closeWithConfirm(1);
    expect(writeFile).not.toHaveBeenCalled();
    expect(tabs.tabs).toHaveLength(0);
  });

  it("keeps the tab open when the prompt is cancelled", async () => {
    ask.mockResolvedValue({ choice: "cancel", checked: false });
    openTab("edited", "old");
    await tabs.closeWithConfirm(1);
    expect(writeFile).not.toHaveBeenCalled();
    expect(tabs.tabs).toHaveLength(1);
  });

  // Closing after a failed save would discard exactly what the user asked to keep.
  it("keeps the tab open when saving fails", async () => {
    ask.mockResolvedValue({ choice: "confirm", checked: false });
    writeFile.mockRejectedValue(new Error("disk full"));
    openTab("edited", "old");
    await tabs.closeWithConfirm(1);
    expect(tabs.tabs).toHaveLength(1);
    expect(tabs.tabs[0].content).toBe("edited");
  });

  it("offers save, discard and cancel", async () => {
    openTab("edited", "old");
    await tabs.closeWithConfirm(1);
    const req = ask.mock.calls[0][0];
    expect(req.altLabel).toBeTruthy(); // the third answer the OS dialog can't show
    expect(req.optionLabel).toBeUndefined(); // nothing to remember here
  });
});

describe("opening a path that isn't on disk", () => {
  const MISSING = "C:/docs/new.md";

  beforeEach(() => {
    tabs.tabs = [];
    tabs.activeId = null;
    readFile.mockRejectedValue(new Error("not found"));
    pathExists.mockResolvedValue(false);
  });

  it("creates an empty file when confirmed", async () => {
    ask.mockResolvedValue({ choice: "confirm", checked: false });
    await tabs.openPath(MISSING);
    expect(writeFile).toHaveBeenCalledWith(MISSING, "", expect.anything());
    expect(tabs.tabs[0].path).toBe(MISSING);
  });

  it("creates nothing when declined", async () => {
    ask.mockResolvedValue({ choice: "cancel", checked: false });
    await tabs.openPath(MISSING);
    expect(writeFile).not.toHaveBeenCalled();
    expect(tabs.tabs).toHaveLength(0);
  });

  it("reports the original error instead of offering to create an unreadable file", async () => {
    pathExists.mockRejectedValue(new Error("access denied"));
    await tabs.openPath(MISSING);
    expect(ask).not.toHaveBeenCalled();
    expect(tabs.tabs).toHaveLength(0);
  });
});
