import { describe, it, expect } from "vitest";
import { orderedRecent } from "./recent-util";

describe("orderedRecent", () => {
  it("puts pinned entries first, then the rest, without duplicates", () => {
    const out = orderedRecent(["a", "b", "c"], ["c"]);
    expect(out).toEqual([
      { path: "c", pinned: true },
      { path: "a", pinned: false },
      { path: "b", pinned: false },
    ]);
  });
  it("keeps pin order and drops pinned from the recent section", () => {
    expect(orderedRecent(["a", "b"], ["b", "a"]).map((e) => e.path)).toEqual(["b", "a"]);
  });
  it("handles empty inputs", () => {
    expect(orderedRecent([], [])).toEqual([]);
  });
});
