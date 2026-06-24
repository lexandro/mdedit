import { describe, it, expect } from "vitest";
import { scanLines } from "./md-lines";

const scan = (src: string) => [...scanLines(src)];

describe("scanLines", () => {
  it("flags fence delimiters and content inside fences", () => {
    expect(scan("a\n```\ncode\n```\nb").map((l) => [l.text, l.isFence, l.inFence])).toEqual([
      ["a", false, false],
      ["```", true, false],
      ["code", false, true],
      ["```", true, false],
      ["b", false, false],
    ]);
  });
  it("treats an unclosed fence as open to end of document", () => {
    expect(scan("```\nx\ny").map((l) => l.inFence)).toEqual([false, true, true]);
  });
  it("supports ~~~ fences", () => {
    expect(scan("~~~\nx\n~~~").map((l) => l.isFence)).toEqual([true, false, true]);
  });
});
