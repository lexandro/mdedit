import { describe, it, expect } from "vitest";
import { confirmDialog, type ConfirmRequest } from "./confirm.svelte";

const req = (title: string): ConfirmRequest => ({
  title,
  message: "m",
  confirmLabel: "yes",
  cancelLabel: "no",
});

describe("confirm store", () => {
  it("resolves the awaited promise with the answer, then clears", async () => {
    const answered = confirmDialog.ask(req("a"));
    expect(confirmDialog.current?.title).toBe("a");

    confirmDialog.answer({ choice: "confirm", checked: true });

    await expect(answered).resolves.toEqual({ choice: "confirm", checked: true });
    expect(confirmDialog.current).toBeNull();
  });

  it("queues a second request instead of stranding the first", async () => {
    const a = confirmDialog.ask(req("a"));
    const b = confirmDialog.ask(req("b"));
    expect(confirmDialog.current?.title).toBe("a");

    confirmDialog.answer({ choice: "confirm", checked: false });
    await expect(a).resolves.toEqual({ choice: "confirm", checked: false });
    expect(confirmDialog.current?.title).toBe("b");

    confirmDialog.cancel();
    await expect(b).resolves.toEqual({ choice: "cancel", checked: false });
    expect(confirmDialog.current).toBeNull();
  });
});
