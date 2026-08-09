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

describe("renderMarkdown — code highlighting", () => {
  it("highlights a registered language", () => {
    const html = renderMarkdown("```ts\nconst a: number = 1;\n```");
    expect(html).toContain("hljs-");
  });

  // The language set is deliberately trimmed to ~26 grammars; anything else must
  // still render as readable, escaped code rather than breaking the block.
  it("renders an unregistered language as plain escaped code", () => {
    const html = renderMarkdown("```brainfuck\n+++++[>+++++<-]>.\n```");
    expect(html).not.toContain("hljs-");
    expect(html).toContain('class="language-brainfuck"');
    expect(html).toContain("+++++[&gt;+++++&lt;-]&gt;.");
  });

  it("renders a fence with no language as plain escaped code", () => {
    const html = renderMarkdown("```\n<script>alert(1)</script>\n```");
    expect(html).not.toContain("hljs-");
    expect(html).toContain("&lt;script&gt;");
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
