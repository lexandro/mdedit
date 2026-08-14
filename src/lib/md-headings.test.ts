import { describe, it, expect } from "vitest";
import {
  parseHeadings,
  sectionEndLine,
  slug,
  buildToc,
  anchorId,
  anchorLine,
} from "./md-headings";
import { renderMarkdown } from "$lib/markdown/renderer";

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
  it("keeps accented letters instead of gutting the slug", () => {
    expect(slug("Áttekintés")).toBe("áttekintés");
    expect(slug("Telepítés & indítás")).toBe("telepítés-indítás");
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
  it("numbers repeated headings the way the renderer numbers its ids", () => {
    expect(buildToc(parseHeadings("# Notes\n# Notes\n"))).toBe("- [Notes](#notes)\n- [Notes](#notes-1)");
  });
});

describe("anchorId", () => {
  it("returns the decoded id of an anchor href", () => {
    expect(anchorId("#how-it-works")).toBe("how-it-works");
    expect(anchorId("#h%C3%A1ttér")).toBe("háttér");
  });
  it("returns null for anything else", () => {
    expect(anchorId("https://x.com")).toBeNull();
    expect(anchorId("./other.md")).toBeNull();
    expect(anchorId("#")).toBeNull();
  });
});

describe("anchorLine", () => {
  const src = "# Intro\n\ntext\n\n## Notes\n\n## Notes\n";
  it("finds the heading line an anchor points at", () => {
    expect(anchorLine(src, "#intro")).toBe(1);
    expect(anchorLine(src, "#notes")).toBe(5);
    expect(anchorLine(src, "#notes-1")).toBe(7);
  });
  it("returns null for unknown anchors and non-anchor hrefs", () => {
    expect(anchorLine(src, "#nope")).toBeNull();
    expect(anchorLine(src, "https://x.com")).toBeNull();
  });
});

// The TOC command writes these links; the preview/export must be able to follow
// them. Feed the producer's output through the consumer to prove they agree.
describe("TOC links round-trip through the renderer", () => {
  it("every generated link has a matching heading id", () => {
    const src = "# Intro\n\n## Setup & config\n\n## Notes\n\n## Notes\n\n### Étel\n";
    const html = renderMarkdown(src);
    const links = [...buildToc(parseHeadings(src)).matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1]);
    expect(links).toHaveLength(5);
    for (const id of links) expect(html).toContain(`id="${id}"`);
  });
});
