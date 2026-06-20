import { describe, it, expect } from "vitest";
import { parseHeadings, sectionEndLine, slug, buildToc } from "./md-headings";

describe("parseHeadings", () => {
  it("collects ATX headings with level, text and 1-based line", () => {
    expect(parseHeadings("# A\n\ntext\n## B")).toEqual([
      { level: 1, text: "A", line: 1 },
      { level: 2, text: "B", line: 4 },
    ]);
  });
  it("ignores headings inside fenced code", () => {
    expect(parseHeadings("# Real\n\n```\n# fake\n```\n")).toEqual([{ level: 1, text: "Real", line: 1 }]);
  });
});

describe("sectionEndLine", () => {
  const hs = parseHeadings("# A\n\nx\n## B\n\ny\n# C\n");
  it("ends a section before the next same-or-higher heading", () => {
    expect(sectionEndLine(hs, 1, 7)).toBe(6); // # A spans until before # C (line 7)
    expect(sectionEndLine(hs, 4, 7)).toBe(6); // ## B spans until before # C
  });
  it("ends the last section at the document end", () => {
    expect(sectionEndLine(hs, 7, 7)).toBe(7);
  });
  it("returns null for a non-heading line", () => {
    expect(sectionEndLine(hs, 3, 7)).toBeNull();
  });
});

describe("slug", () => {
  it("lowercases, strips punctuation and hyphenates spaces", () => {
    expect(slug("Hello, World!")).toBe("hello-world");
    expect(slug("  Getting Started  ")).toBe("getting-started");
  });
});

describe("buildToc", () => {
  it("nests links by heading level", () => {
    const toc = buildToc(parseHeadings("# Title\n## Sub A\n## Sub B\n"));
    expect(toc).toBe("- [Title](#title)\n  - [Sub A](#sub-a)\n  - [Sub B](#sub-b)");
  });
  it("is empty without headings", () => {
    expect(buildToc([])).toBe("");
  });
});
