import { describe, it, expect } from "vitest";
import { mnemonicIndex, nextRow, rowByLetter, type MenuRow } from "./menu-util";

const LABELS = ["File", "Edit", "View", "Help"];
// A dropdown: two items, a separator, an item, a disabled placeholder.
const ROWS: MenuRow[] = ["Undo", "Redo", null, "Cut", null];

describe("mnemonicIndex", () => {
  it("matches the first letter, case-insensitively", () => {
    expect(mnemonicIndex(LABELS, "f")).toBe(0);
    expect(mnemonicIndex(LABELS, "E")).toBe(1);
    expect(mnemonicIndex(LABELS, "v")).toBe(2);
    expect(mnemonicIndex(LABELS, "H")).toBe(3);
  });
  it("returns -1 when nothing matches", () => {
    expect(mnemonicIndex(LABELS, "z")).toBe(-1);
  });
});

describe("nextRow", () => {
  it("starts at the first selectable row from -1", () => {
    expect(nextRow(ROWS, -1, 1)).toBe(0);
  });
  it("starts at the last selectable row from the end", () => {
    expect(nextRow(ROWS, ROWS.length, -1)).toBe(3);
  });
  it("skips separators and disabled rows", () => {
    expect(nextRow(ROWS, 1, 1)).toBe(3);
    expect(nextRow(ROWS, 3, -1)).toBe(1);
  });
  it("wraps around in both directions", () => {
    expect(nextRow(ROWS, 3, 1)).toBe(0);
    expect(nextRow(ROWS, 0, -1)).toBe(3);
  });
  it("returns -1 when no row is selectable", () => {
    expect(nextRow([null, null], -1, 1)).toBe(-1);
    expect(nextRow([], -1, 1)).toBe(-1);
  });
});

describe("rowByLetter", () => {
  it("finds the next match after the current row, wrapping", () => {
    expect(rowByLetter(ROWS, "r", -1)).toBe(1);
    expect(rowByLetter(ROWS, "c", 3)).toBe(3); // wraps back to itself
    expect(rowByLetter(ROWS, "u", 0)).toBe(0);
  });
  it("cycles through several rows sharing a letter", () => {
    const rows: MenuRow[] = ["Save", "Save as", "Open"];
    expect(rowByLetter(rows, "s", -1)).toBe(0);
    expect(rowByLetter(rows, "s", 0)).toBe(1);
    expect(rowByLetter(rows, "s", 1)).toBe(0);
  });
  it("ignores separators and returns -1 without a match", () => {
    expect(rowByLetter(ROWS, "x", -1)).toBe(-1);
    expect(rowByLetter([null, null], "a", -1)).toBe(-1);
  });
});
