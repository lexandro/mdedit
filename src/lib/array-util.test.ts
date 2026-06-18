import { describe, it, expect } from "vitest";
import { moveItem } from "./array-util";

describe("moveItem", () => {
  it("moves an item forward", () => {
    expect(moveItem(["a", "b", "c", "d"], 1, 3)).toEqual(["a", "c", "d", "b"]);
  });
  it("moves an item backward", () => {
    expect(moveItem(["a", "b", "c", "d"], 3, 0)).toEqual(["d", "a", "b", "c"]);
  });
  it("returns the same array for a no-op or out-of-range move", () => {
    const arr = ["a", "b"];
    expect(moveItem(arr, 1, 1)).toBe(arr);
    expect(moveItem(arr, -1, 0)).toBe(arr);
    expect(moveItem(arr, 0, 5)).toBe(arr);
  });
});
