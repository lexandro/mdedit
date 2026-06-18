import { describe, it, expect } from "vitest";
import { fuzzyScore, fuzzyFilter } from "./fuzzy";

describe("fuzzyScore", () => {
  it("matches a subsequence and rejects a non-subsequence", () => {
    expect(fuzzyScore("sv", "Save")).not.toBeNull();
    expect(fuzzyScore("xyz", "Save")).toBeNull();
  });
  it("scores consecutive / prefix matches higher than scattered ones", () => {
    expect(fuzzyScore("sav", "Save")!).toBeGreaterThan(fuzzyScore("sae", "Save As")!);
  });
  it("treats an empty query as a match", () => {
    expect(fuzzyScore("", "anything")).not.toBeNull();
  });
});

describe("fuzzyFilter", () => {
  const cmds = [{ label: "Save" }, { label: "Save As" }, { label: "Open File" }];
  it("filters to matches, best first", () => {
    const out = fuzzyFilter("save", cmds, (c) => c.label).map((c) => c.label);
    expect(out).toEqual(["Save", "Save As"]);
  });
  it("returns nothing when no item matches", () => {
    expect(fuzzyFilter("zzz", cmds, (c) => c.label)).toEqual([]);
  });
});
