import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import CommandPalette from "./CommandPalette.svelte";

describe("CommandPalette", () => {
  it("filters by query and runs the clicked command", async () => {
    const onRun = vi.fn();
    render(CommandPalette, { props: { onRun, onClose: vi.fn() } });

    await fireEvent.input(screen.getByPlaceholderText(/type a command/i), {
      target: { value: "about" },
    });
    await fireEvent.click(screen.getByText("About mdedit"));

    expect(onRun).toHaveBeenCalledWith("about");
  });

  it("runs the top match on Enter", async () => {
    const onRun = vi.fn();
    render(CommandPalette, { props: { onRun, onClose: vi.fn() } });

    const input = screen.getByPlaceholderText(/type a command/i);
    await fireEvent.input(input, { target: { value: "save as" } });
    await fireEvent.keyDown(input, { key: "Enter" });

    expect(onRun).toHaveBeenCalledWith("save_as");
  });

  it("shows an empty state and closes on Escape", async () => {
    const onClose = vi.fn();
    render(CommandPalette, { props: { onRun: vi.fn(), onClose } });

    const input = screen.getByPlaceholderText(/type a command/i);
    await fireEvent.input(input, { target: { value: "zzzzz" } });
    expect(screen.queryByText(/no matching command/i)).not.toBeNull();

    await fireEvent.keyDown(input, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
