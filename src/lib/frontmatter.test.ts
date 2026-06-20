import { describe, it, expect } from "vitest";
import { splitFrontmatter } from "./frontmatter";

describe("splitFrontmatter", () => {
  it("extracts leading frontmatter and returns the body", () => {
    expect(splitFrontmatter("---\ntitle: Hi\ntags: [a]\n---\n# Body\n")).toEqual({
      frontmatter: "title: Hi\ntags: [a]",
      body: "# Body\n",
    });
  });
  it("handles an empty body after frontmatter", () => {
    expect(splitFrontmatter("---\na: 1\n---\n")).toEqual({ frontmatter: "a: 1", body: "" });
  });
  it("returns null when there is no frontmatter", () => {
    expect(splitFrontmatter("# Just a doc")).toEqual({ frontmatter: null, body: "# Just a doc" });
  });
  it("only matches at the very start", () => {
    const src = "text\n---\na: 1\n---\n";
    expect(splitFrontmatter(src)).toEqual({ frontmatter: null, body: src });
  });
});
