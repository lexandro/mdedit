import { describe, it, expect } from "vitest";
import { LIGHT_VARS, THEME_TOKENS, standaloneHtml, varBlock } from "./doc-html";

describe("varBlock", () => {
  it("emits the tokens and the color scheme on :root", () => {
    expect(varBlock({ "--bg": "#fff", "--fg": "#000" }, "light")).toBe(
      ":root{color-scheme:light;--bg:#fff;--fg:#000;}",
    );
  });
  it("covers every token the stylesheet references", () => {
    expect(Object.keys(LIGHT_VARS).sort()).toEqual([...THEME_TOKENS].sort());
  });
});

describe("standaloneHtml", () => {
  it("keeps the stylesheet order so the last one wins", () => {
    const html = standaloneHtml({ body: "", title: "t", css: ["/*a*/", "/*b*/", "/*c*/"] });
    expect(html).toContain("/*a*/\n/*b*/\n/*c*/");
  });
  it("escapes the title", () => {
    const html = standaloneHtml({ body: "", title: "<script>x</script>", css: [] });
    expect(html).toContain("<title>&lt;script&gt;x&lt;/script&gt;</title>");
    expect(html).not.toContain("<script>");
  });
  it("wraps the body unescaped in a markdown-body main", () => {
    const html = standaloneHtml({ body: "<h1>Hi</h1>", title: "t", css: [] });
    expect(html).toContain('<main class="markdown-body"><h1>Hi</h1></main>');
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('<meta charset="utf-8" />');
  });
});
