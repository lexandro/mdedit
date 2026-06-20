import { describe, it, expect } from "vitest";
import { renderMarkdown } from "./renderer";

describe("renderMarkdown — math", () => {
  it("renders inline $...$ via KaTeX", () => {
    const html = renderMarkdown("Euler: $e^{i\\pi}+1=0$");
    expect(html).toContain("katex");
  });
  it("renders display $$...$$ blocks via KaTeX", () => {
    const html = renderMarkdown("$$\\int_0^1 x^2\\,dx$$");
    expect(html).toContain("katex");
  });
  it("still renders ordinary Markdown", () => {
    expect(renderMarkdown("# Title")).toContain("<h1>");
  });
});

describe("renderMarkdown — frontmatter", () => {
  it("renders leading frontmatter as a metadata block, body as Markdown", () => {
    const html = renderMarkdown("---\ntitle: Hi\n---\n# Body\n");
    expect(html).toContain('class="frontmatter"');
    expect(html).toContain("title: Hi");
    expect(html).toContain("<h1>Body</h1>");
  });
});
