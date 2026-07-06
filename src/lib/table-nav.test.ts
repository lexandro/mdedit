import { describe, it, expect } from "vitest";
import { navTarget } from "./table-nav";

// 2 rows x 2 cols grid; caret flags default to "somewhere inside the text".
const nav = (key: string, shift: boolean, r: number, c: number, atStart = false, atEnd = false) =>
  navTarget(key, shift, r, c, 2, 2, atStart, atEnd);

describe("navTarget", () => {
  it("Tab walks row-major and wraps to the next row", () => {
    expect(nav("Tab", false, 0, 0)).toEqual({ r: 0, c: 1 });
    expect(nav("Tab", false, 0, 1)).toEqual({ r: 1, c: 0 });
  });
  it("Tab on the last cell requests a new row", () => {
    expect(nav("Tab", false, 1, 1)).toBe("appendRow");
  });
  it("Shift+Tab walks backwards and stops before the first cell", () => {
    expect(nav("Tab", true, 1, 0)).toEqual({ r: 0, c: 1 });
    expect(nav("Tab", true, 0, 1)).toEqual({ r: 0, c: 0 });
    expect(nav("Tab", true, 0, 0)).toBeNull();
  });
  it("Enter moves down, none past the last row", () => {
    expect(nav("Enter", false, 0, 1)).toEqual({ r: 1, c: 1 });
    expect(nav("Enter", false, 1, 1)).toBeNull();
  });
  it("vertical arrows move without wrapping", () => {
    expect(nav("ArrowDown", false, 0, 0)).toEqual({ r: 1, c: 0 });
    expect(nav("ArrowDown", false, 1, 0)).toBeNull();
    expect(nav("ArrowUp", false, 1, 1)).toEqual({ r: 0, c: 1 });
    expect(nav("ArrowUp", false, 0, 0)).toBeNull();
  });
  it("horizontal arrows only leave the cell from the caret edge", () => {
    expect(nav("ArrowLeft", false, 0, 1)).toBeNull();
    expect(nav("ArrowLeft", false, 0, 1, true)).toEqual({ r: 0, c: 0 });
    expect(nav("ArrowRight", false, 0, 0)).toBeNull();
    expect(nav("ArrowRight", false, 0, 0, false, true)).toEqual({ r: 0, c: 1 });
  });
  it("horizontal arrows never wrap rows", () => {
    expect(nav("ArrowLeft", false, 1, 0, true)).toBeNull();
    expect(nav("ArrowRight", false, 0, 1, false, true)).toBeNull();
  });
  it("other keys are left to the input", () => {
    expect(nav("a", false, 0, 0)).toBeNull();
    expect(nav("Home", false, 0, 0)).toBeNull();
  });
});
