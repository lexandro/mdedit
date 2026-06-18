import { describe, it, expect } from "vitest";
import { toggleTaskInSource } from "./md-tasks";

describe("toggleTaskInSource", () => {
  const doc = "- [ ] one\n- [x] two\n- [ ] three";

  it("checks the n-th item", () => {
    expect(toggleTaskInSource(doc, 0, true)).toBe("- [x] one\n- [x] two\n- [ ] three");
    expect(toggleTaskInSource(doc, 2, true)).toBe("- [ ] one\n- [x] two\n- [x] three");
  });

  it("unchecks the n-th item", () => {
    expect(toggleTaskInSource(doc, 1, false)).toBe("- [ ] one\n- [ ] two\n- [ ] three");
  });

  it("supports ordered lists and *,+ bullets, preserving text", () => {
    expect(toggleTaskInSource("1. [ ] a\n* [ ] b", 1, true)).toBe("1. [ ] a\n* [x] b");
  });

  it("skips task-like lines inside fenced code", () => {
    const src = "```\n- [ ] not a task\n```\n- [ ] real";
    expect(toggleTaskInSource(src, 0, true)).toBe("```\n- [ ] not a task\n```\n- [x] real");
  });

  it("returns the source unchanged when n is out of range", () => {
    expect(toggleTaskInSource(doc, 9, true)).toBe(doc);
  });
});
