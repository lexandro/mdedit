import { describe, it, expect } from "vitest";
import { parseUserSnippets, mergeSnippets, validateUserSnippet } from "./user-snippets";
import { BUILTIN_SNIPPETS } from "./snippets";

const valid = { id: "u1", trigger: "sig", body: "-- ${name}", label: "Signature" };

describe("parseUserSnippets", () => {
  it("accepts a valid entry", () => {
    expect(parseUserSnippets([valid])).toEqual([valid]);
  });
  it("returns [] for non-array input", () => {
    for (const raw of [null, undefined, "x", 42, { 0: valid }]) {
      expect(parseUserSnippets(raw)).toEqual([]);
    }
  });
  it("drops malformed entries but keeps valid ones", () => {
    const raw = [
      null,
      "string",
      { ...valid, id: "" },
      { ...valid, trigger: "has space" },
      { ...valid, trigger: "" },
      { ...valid, body: "" },
      { ...valid, label: "   " },
      { ...valid, body: 42 },
      valid,
    ];
    expect(parseUserSnippets(raw)).toEqual([valid]);
  });
  it("drops extra unknown keys", () => {
    expect(parseUserSnippets([{ ...valid, evil: "x" }])).toEqual([valid]);
  });
  it("drops duplicate ids and triggers", () => {
    const dupId = { ...valid, trigger: "other" };
    const dupTrigger = { ...valid, id: "u2" };
    expect(parseUserSnippets([valid, dupId, dupTrigger])).toEqual([valid]);
  });
});

describe("mergeSnippets", () => {
  it("appends user snippets after built-ins", () => {
    const all = mergeSnippets(BUILTIN_SNIPPETS, [valid]);
    expect(all).toHaveLength(BUILTIN_SNIPPETS.length + 1);
    expect(all.at(-1)).toEqual(valid);
  });
  it("a user trigger shadows the built-in snippet", () => {
    const custom = { ...valid, trigger: "date" };
    const all = mergeSnippets(BUILTIN_SNIPPETS, [custom]);
    expect(all).toHaveLength(BUILTIN_SNIPPETS.length);
    expect(all.filter((s) => s.trigger === "date")).toEqual([custom]);
  });
  it("keeps unique ids and triggers (picker/completion invariant)", () => {
    const all = mergeSnippets(BUILTIN_SNIPPETS, [valid, { ...valid, id: "u2", trigger: "task" }]);
    expect(new Set(all.map((s) => s.id)).size).toBe(all.length);
    expect(new Set(all.map((s) => s.trigger)).size).toBe(all.length);
  });
});

describe("validateUserSnippet", () => {
  it("passes a valid snippet", () => {
    expect(validateUserSnippet(valid, [])).toBeNull();
  });
  it("flags each invalid field", () => {
    expect(validateUserSnippet({ ...valid, label: " " }, [])).toBe("label");
    expect(validateUserSnippet({ ...valid, trigger: "a b" }, [])).toBe("trigger");
    expect(validateUserSnippet({ ...valid, trigger: "" }, [])).toBe("trigger");
    expect(validateUserSnippet({ ...valid, body: "" }, [])).toBe("body");
  });
  it("flags a trigger already used by another user snippet", () => {
    expect(validateUserSnippet(valid, [{ ...valid, id: "u2" }])).toBe("duplicate");
  });
  it("allows shadowing a built-in trigger (merge handles it)", () => {
    expect(validateUserSnippet({ ...valid, trigger: "date" }, [])).toBeNull();
  });
});
