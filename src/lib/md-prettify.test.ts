import { describe, it, expect } from "vitest";
import { formatMarkdown } from "./md-prettify";

describe("formatMarkdown", () => {
  it("collapses blank-line runs and ensures one trailing newline", () => {
    expect(formatMarkdown("a\n\n\n\nb")).toBe("a\n\nb\n");
    expect(formatMarkdown("a\n\n\n")).toBe("a\n");
  });
  it("trims accidental trailing whitespace but keeps hard breaks", () => {
    expect(formatMarkdown("a \nb")).toBe("a\nb\n"); // single trailing space dropped
    expect(formatMarkdown("a  \nb")).toBe("a  \nb\n"); // hard break preserved (2 spaces)
  });
  it("normalizes list bullets to '-'", () => {
    expect(formatMarkdown("* one\n+ two")).toBe("- one\n- two\n");
  });
  it("leaves fenced code blocks untouched", () => {
    const src = "```\n  spaced *kept*  \n```\n";
    expect(formatMarkdown(src)).toBe("```\n  spaced *kept*  \n```\n");
  });
  it("trims leading/trailing blank lines", () => {
    expect(formatMarkdown("\n\n# Title\n\n")).toBe("# Title\n");
  });
});
