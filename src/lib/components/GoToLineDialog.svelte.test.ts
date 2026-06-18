import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import GoToLineDialog from "./GoToLineDialog.svelte";

describe("GoToLineDialog", () => {
  it("closes on Enter after entering a number", async () => {
    const onClose = vi.fn();
    render(GoToLineDialog, { props: { onClose } });

    const input = screen.getByPlaceholderText(/line number/i);
    await fireEvent.input(input, { target: { value: "12" } });
    await fireEvent.keyDown(input, { key: "Enter" });

    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(GoToLineDialog, { props: { onClose } });

    await fireEvent.keyDown(screen.getByPlaceholderText(/line number/i), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
