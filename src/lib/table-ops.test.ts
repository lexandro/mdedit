import { describe, it, expect } from "vitest";
import { addRow, removeRow, moveRow, addCol, removeCol, moveCol, setAlign } from "./table-ops";
import type { TableModel } from "./table-model";

const base = (): TableModel => ({
  aligns: ["left", "none"],
  cells: [
    ["h1", "h2"],
    ["a1", "a2"],
    ["b1", "b2"],
  ],
});

describe("row ops", () => {
  it("addRow inserts a blank row at the index", () => {
    const t = addRow(base(), 1);
    expect(t.cells).toEqual([
      ["h1", "h2"],
      ["", ""],
      ["a1", "a2"],
      ["b1", "b2"],
    ]);
  });
  it("addRow appends at cells.length and rejects the header slot", () => {
    expect(addRow(base(), 3).cells[3]).toEqual(["", ""]);
    expect(addRow(base(), 0)).toEqual(base());
  });
  it("removeRow removes body rows, keeps the header, allows header-only", () => {
    expect(removeRow(base(), 2).cells).toEqual([
      ["h1", "h2"],
      ["a1", "a2"],
    ]);
    expect(removeRow(base(), 0)).toEqual(base());
    const headerOnly = removeRow(removeRow(base(), 1), 1);
    expect(headerOnly.cells).toEqual([["h1", "h2"]]);
    expect(removeRow(headerOnly, 1)).toEqual(headerOnly);
  });
  it("moveRow swaps body rows and never moves the header", () => {
    expect(moveRow(base(), 1, 2).cells).toEqual([
      ["h1", "h2"],
      ["b1", "b2"],
      ["a1", "a2"],
    ]);
    expect(moveRow(base(), 1, 0)).toEqual(base());
    expect(moveRow(base(), 0, 1)).toEqual(base());
    expect(moveRow(base(), 2, 5)).toEqual(base());
  });
  it("does not mutate the input model", () => {
    const t = base();
    addRow(t, 1);
    removeRow(t, 1);
    moveRow(t, 1, 2);
    expect(t).toEqual(base());
  });
});

describe("column ops", () => {
  it("addCol splices an empty cell into every row and a 'none' align", () => {
    const t = addCol(base(), 1);
    expect(t.aligns).toEqual(["left", "none", "none"]);
    expect(t.cells).toEqual([
      ["h1", "", "h2"],
      ["a1", "", "a2"],
      ["b1", "", "b2"],
    ]);
  });
  it("removeCol keeps aligns and rows consistent and floors at one column", () => {
    const t = removeCol(base(), 0);
    expect(t.aligns).toEqual(["none"]);
    expect(t.cells).toEqual([["h2"], ["a2"], ["b2"]]);
    expect(removeCol(t, 0)).toEqual(t);
  });
  it("moveCol moves aligns together with the cells", () => {
    const t = moveCol(base(), 0, 1);
    expect(t.aligns).toEqual(["none", "left"]);
    expect(t.cells).toEqual([
      ["h2", "h1"],
      ["a2", "a1"],
      ["b2", "b1"],
    ]);
    expect(moveCol(base(), 0, 5)).toEqual(base());
  });
  it("setAlign updates one column only", () => {
    const t = setAlign(base(), 1, "center");
    expect(t.aligns).toEqual(["left", "center"]);
    expect(setAlign(base(), 9, "right")).toEqual(base());
  });
  it("does not mutate the input model", () => {
    const t = base();
    addCol(t, 0);
    removeCol(t, 0);
    moveCol(t, 0, 1);
    setAlign(t, 0, "right");
    expect(t).toEqual(base());
  });
});
