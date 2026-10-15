import { describe, it, expect, vi } from "vitest";
import { renderDiagramsIn, type DiagramRenderer } from "./diagrams";
import { renderMarkdown } from "./renderer";

const body = (html: string): HTMLElement =>
  new DOMParser().parseFromString(html, "text/html").body;

/** Shaped like Mermaid's real output: width 100%, an inline max-width and a
 *  viewBox, and no height attribute. */
const svgFor = (code: string) =>
  `<svg width="100%" style="max-width: 1240px;" viewBox="0 0 1240 400"><title>${code}</title></svg>`;

const ok: DiagramRenderer = (code) => Promise.resolve(svgFor(code));
const fence = (code: string) => `<pre class="mermaid">${code}</pre>`;

describe("renderDiagramsIn", () => {
  it("leaves a document without diagrams untouched", async () => {
    const root = body("<p>plain</p>");
    const render = vi.fn(ok);
    expect(await renderDiagramsIn(root, render)).toEqual({ rendered: 0, failed: 0 });
    expect(render).not.toHaveBeenCalled();
    expect(root.innerHTML).toBe("<p>plain</p>");
  });

  it("hands the renderer the unescaped source", async () => {
    const render = vi.fn(ok);
    await renderDiagramsIn(body(fence("graph TD\nA --&gt; B &amp; C --&gt; D&quot;E&quot;")), render);
    expect(render).toHaveBeenCalledWith('graph TD\nA --> B & C --> D"E"');
  });

  it("round-trips renderMarkdown's own output", async () => {
    const source = "graph TD\nA --> B";
    const render = vi.fn(ok);
    await renderDiagramsIn(body(renderMarkdown("```mermaid\n" + source + "\n```")), render);
    expect(render).toHaveBeenCalledWith(source);
  });

  it("replaces the source block with the SVG", async () => {
    const root = body(fence("graph TD\nA --&gt; B"));
    expect(await renderDiagramsIn(root, ok)).toEqual({ rendered: 1, failed: 0 });
    expect(root.querySelector("pre.mermaid")).toBeNull();
    expect(root.querySelector(".mermaid-svg > svg")).not.toBeNull();
  });

  it("keeps Mermaid's sizing attributes through re-serialization", async () => {
    const root = body(fence("graph TD"));
    await renderDiagramsIn(root, ok);
    const svg = root.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("100%");
    expect(svg.getAttribute("style")).toBe("max-width: 1240px;");
    expect(svg.getAttribute("viewBox")).toBe("0 0 1240 400");
  });

  it("keeps the source of a diagram that fails to render", async () => {
    const root = body([fence("one"), fence("two --&gt; boom"), fence("three")].join(""));
    const render: DiagramRenderer = (code) =>
      code.startsWith("two") ? Promise.reject(new Error("bad diagram")) : ok(code);
    expect(await renderDiagramsIn(root, render)).toEqual({ rendered: 2, failed: 1 });
    const kept = root.querySelectorAll("pre.mermaid");
    expect(kept).toHaveLength(1);
    expect(kept[0].textContent).toBe("two --> boom");
    expect(kept[0].innerHTML).toBe("two --&gt; boom"); // not double-escaped
    expect(root.querySelectorAll(".mermaid-svg")).toHaveLength(2);
  });

  it("renders in document order, one at a time", async () => {
    const calls: string[] = [];
    let inFlight = 0;
    const render: DiagramRenderer = async (code) => {
      expect(inFlight).toBe(0);
      inFlight++;
      calls.push(code);
      await Promise.resolve();
      inFlight--;
      return svgFor(code);
    };
    await renderDiagramsIn(body([fence("a"), fence("b"), fence("c")].join("")), render);
    expect(calls).toEqual(["a", "b", "c"]);
  });

  it("only matches pre.mermaid", async () => {
    const html = [
      '<pre class="mermaid extra">graph TD</pre>',
      '<pre><code class="language-mermaid">graph TD</code></pre>',
      '<pre><code class="hljs language-js">const mermaid = 1;</code></pre>',
    ].join("");
    const root = body(html);
    const render = vi.fn(ok);
    expect(await renderDiagramsIn(root, render)).toEqual({ rendered: 1, failed: 0 });
    expect(render).toHaveBeenCalledTimes(1);
    expect(root.innerHTML).toContain('<code class="language-mermaid">graph TD</code>');
    expect(root.innerHTML).toContain("const mermaid = 1;");
  });

  it("skips an empty diagram instead of calling the renderer", async () => {
    const root = body('<pre class="mermaid">   \n </pre>');
    const render = vi.fn(ok);
    expect(await renderDiagramsIn(root, render)).toEqual({ rendered: 0, failed: 0 });
    expect(render).not.toHaveBeenCalled();
    expect(root.querySelector("pre.mermaid")).not.toBeNull();
  });

  it("is a no-op on an already rendered document", async () => {
    const root = body(fence("graph TD"));
    await renderDiagramsIn(root, ok);
    const once = root.innerHTML;
    expect(await renderDiagramsIn(root, ok)).toEqual({ rendered: 0, failed: 0 });
    expect(root.innerHTML).toBe(once);
  });
});
