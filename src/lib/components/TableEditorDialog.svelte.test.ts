import { render, screen, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import TableEditorDialog from "./TableEditorDialog.svelte";
import type { TableModel } from "$lib/table-model";

const model = (): TableModel => ({
  aligns: ["none", "none"],
  cells: [
    ["h1", "h2"],
    ["a1", "a2"],
  ],
});

const setup = (m: TableModel = model()) => {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(TableEditorDialog, { props: { model: m, onSave, onClose } });
  return { onSave, onClose };
};

describe("TableEditorDialog", () => {
  it("renders one input per cell with the model's values", () => {
    setup();
    for (const v of ["h1", "h2", "a1", "a2"]) {
      expect(screen.getByDisplayValue(v)).toBeTruthy();
    }
  });

  it("saves edited cells without mutating the prop model", async () => {
    const m = model();
    const { onSave } = setup(m);
    await fireEvent.input(screen.getByDisplayValue("a1"), { target: { value: "edited" } });
    await fireEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith({
      aligns: ["none", "none"],
      cells: [
        ["h1", "h2"],
        ["edited", "a2"],
      ],
    });
    expect(m.cells[1][0]).toBe("a1");
  });

  it("closes on Escape and backdrop click without saving", async () => {
    const { onSave, onClose } = setup();
    await fireEvent.keyDown(screen.getByDisplayValue("h1"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    await fireEvent.click(document.querySelector(".backdrop")!);
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("Tab on the last cell appends a row", async () => {
    setup();
    expect(screen.getAllByRole("textbox")).toHaveLength(4);
    await fireEvent.keyDown(screen.getByDisplayValue("a2"), { key: "Tab" });
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
  });

  it("Alt+ArrowRight moves the column, aligns included", async () => {
    const m = model();
    m.aligns = ["left", "right"];
    const { onSave } = setup(m);
    await fireEvent.keyDown(screen.getByDisplayValue("h1"), { key: "ArrowRight", altKey: true });
    await fireEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith({
      aligns: ["right", "left"],
      cells: [
        ["h2", "h1"],
        ["a2", "a1"],
      ],
    });
  });

  it("reflects an alignment change in the saved model", async () => {
    const { onSave } = setup();
    const [first] = screen.getAllByLabelText("Alignment");
    await fireEvent.change(first, { target: { value: "center" } });
    await fireEvent.click(screen.getByText("Save"));
    expect(onSave.mock.calls[0][0].aligns).toEqual(["center", "none"]);
  });

  it("adds and removes rows and columns via the buttons", async () => {
    setup();
    await fireEvent.click(screen.getByText("+ Add row"));
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
    await fireEvent.click(screen.getAllByLabelText("Delete row")[1]);
    expect(screen.getAllByRole("textbox")).toHaveLength(4);
    await fireEvent.click(screen.getByText("+ Add column"));
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
  });

  it("disables delete-column when only one column remains", async () => {
    setup();
    await fireEvent.click(screen.getAllByLabelText("Delete column")[0]);
    const remaining = screen.getAllByLabelText("Delete column");
    expect(remaining).toHaveLength(1);
    expect((remaining[0] as HTMLButtonElement).disabled).toBe(true);
  });
});
