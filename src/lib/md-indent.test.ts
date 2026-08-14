import { describe, it, expect } from "vitest";
import { visualColumn, tabInsert, tabAction, type IndentStyle, type TabAction } from "./md-indent";
import { renderMarkdown } from "$lib/markdown/renderer";

/** Run Tab on line `row` (0-based) of `lines`, cursor at visual column `col`. */
function tabAt(
  lines: string[],
  row: number,
  col: number,
  opts: { shift?: boolean; style?: IndentStyle } = {},
): TabAction {
  return tabAction(lines[row], col, (back) => lines[row - back] ?? null, {
    shift: opts.shift ?? false,
    style: opts.style ?? "spaces",
  });
}

/** Apply a reindent action to a line, the way the editor shell does. */
function reindent(line: string, action: TabAction): string {
  if (action.kind !== "reindent") throw new Error(`expected reindent, got ${action.kind}`);
  return action.indent + line.trimStart();
}

describe("visualColumn", () => {
  it("counts plain characters", () => {
    expect(visualColumn("")).toBe(0);
    expect(visualColumn("ab")).toBe(2);
  });
  it("expands tabs to the next 4-column stop (CommonMark)", () => {
    expect(visualColumn("\t")).toBe(4);
    expect(visualColumn("ab\t")).toBe(4);
    expect(visualColumn("abcd\t")).toBe(8);
    expect(visualColumn("\t\t")).toBe(8);
  });
});

describe("tabInsert", () => {
  it("fills up to the next tab stop with spaces", () => {
    expect(tabInsert(0, "spaces")).toBe("    ");
    expect(tabInsert(2, "spaces")).toBe("  ");
    expect(tabInsert(3, "spaces")).toBe(" ");
    expect(tabInsert(4, "spaces")).toBe("    ");
  });
  it("emits a real tab in tab style", () => {
    expect(tabInsert(0, "tab")).toBe("\t");
    expect(tabInsert(3, "tab")).toBe("\t");
  });
});

describe("tabAction — insert at the cursor", () => {
  it("inserts inside a list item's text instead of moving the line (the bug)", () => {
    expect(tabAt(["- item"], 0, 4)).toEqual({ kind: "insert", text: "    " });
  });
  it("inserts on a plain line, aligned to the next tab stop", () => {
    expect(tabAt(["Hello"], 0, 5)).toEqual({ kind: "insert", text: "   " });
    expect(tabAt(["Hello"], 0, 0)).toEqual({ kind: "insert", text: "    " });
  });
  it("measures the column through existing tabs", () => {
    // "\tfoo" ends at column 7, so one space reaches the stop at 8.
    expect(tabAt(["\tfoo"], 0, visualColumn("\tfoo"))).toEqual({ kind: "insert", text: " " });
    expect(tabAt(["\t"], 0, visualColumn("\t"))).toEqual({ kind: "insert", text: "    " });
  });
  it("honours the tab style", () => {
    expect(tabAt(["- item"], 0, 4, { style: "tab" })).toEqual({ kind: "insert", text: "\t" });
  });
});

describe("tabAction — list indent", () => {
  it("nests a bullet under its previous sibling at the content column", () => {
    expect(tabAt(["- a", "- b"], 1, 0)).toEqual({ kind: "reindent", indent: "  " });
  });
  it("uses the wider content column of an ordered marker", () => {
    expect(tabAt(["1. a", "1. b"], 1, 0)).toEqual({ kind: "reindent", indent: "   " });
    expect(tabAt(["10. a", "11. b"], 1, 0)).toEqual({ kind: "reindent", indent: "    " });
  });
  it("ignores the checkbox — a task sub-list aligns to the marker", () => {
    expect(tabAt(["- [ ] a", "- [x] b"], 1, 0)).toEqual({ kind: "reindent", indent: "  " });
  });
  it("follows a wide gap after the marker", () => {
    expect(tabAt(["-   a", "-   b"], 1, 0)).toEqual({ kind: "reindent", indent: "    " });
  });
  it("acts anywhere up to the content column", () => {
    expect(tabAt(["- a", "- b"], 1, 2)).toEqual({ kind: "reindent", indent: "  " });
    expect(tabAt(["- a", "- b"], 1, 1)).toEqual({ kind: "reindent", indent: "  " });
  });
  it("skips over deeper items to find the sibling above", () => {
    expect(tabAt(["- a", "  - b", "- c"], 2, 0)).toEqual({ kind: "reindent", indent: "  " });
  });
  it("nests a second level under its own sibling", () => {
    expect(tabAt(["- a", "  - b", "  - c"], 2, 2)).toEqual({ kind: "reindent", indent: "    " });
  });
  it("crosses a single blank line (loose list)", () => {
    expect(tabAt(["- a", "", "- b"], 2, 0)).toEqual({ kind: "reindent", indent: "  " });
  });
  it("stops at two blank lines", () => {
    expect(tabAt(["- a", "", "", "- b"], 3, 0)).toEqual({ kind: "none" });
  });
  it("stops at a non-list line", () => {
    expect(tabAt(["- a", "text", "- b"], 2, 0)).toEqual({ kind: "none" });
  });
  it("refuses to indent the first item of a list", () => {
    expect(tabAt(["- a"], 0, 0)).toEqual({ kind: "none" });
  });
  it("refuses when the item is already nested without a sibling", () => {
    expect(tabAt(["- a", "  - b"], 1, 2)).toEqual({ kind: "none" });
  });
  it("aligns with spaces even in tab style (a tab cannot hit column 2)", () => {
    expect(tabAt(["- a", "- b"], 1, 0, { style: "tab" })).toEqual({
      kind: "reindent",
      indent: "  ",
    });
  });
});

describe("tabAction — Shift+Tab", () => {
  it("outdents a nested item to its parent's indent", () => {
    expect(tabAt(["- a", "  - b"], 1, 2, { shift: true })).toEqual({ kind: "reindent", indent: "" });
  });
  it("outdents a third level to the second", () => {
    expect(tabAt(["- a", "  - b", "    - c"], 2, 4, { shift: true })).toEqual({
      kind: "reindent",
      indent: "  ",
    });
  });
  it("outdents from inside the item's text too", () => {
    expect(tabAt(["- a", "  - bcd"], 1, 6, { shift: true })).toEqual({
      kind: "reindent",
      indent: "",
    });
  });
  it("does nothing on a top-level item", () => {
    expect(tabAt(["- a", "- b"], 1, 0, { shift: true })).toEqual({ kind: "none" });
  });
  it("falls back to the editor's block outdent on a plain line", () => {
    expect(tabAt(["    text"], 0, 4, { shift: true })).toEqual({ kind: "outdentLine" });
  });
});

// The point of aligning to the parent's content column: what Tab writes has to
// come back out of markdown-it as a real sub-list, not as an indented code block.
describe("round-trip through the renderer", () => {
  const nested = /<li>[\s\S]*<ul>/;

  it("bullet: the indented line renders as a nested list", () => {
    const src = ["- first", "- second"];
    expect(renderMarkdown(src.join("\n"))).not.toMatch(nested); // control: flat before
    const out = [src[0], reindent(src[1], tabAt(src, 1, 0))].join("\n");
    expect(renderMarkdown(out)).toMatch(nested);
    expect(renderMarkdown(out)).not.toContain("<pre>");
  });

  it("ordered: the indented line renders as a nested list", () => {
    const src = ["1. first", "1. second"];
    const out = [src[0], reindent(src[1], tabAt(src, 1, 0))].join("\n");
    expect(renderMarkdown(out)).toMatch(/<li>[\s\S]*<ol>/);
    expect(renderMarkdown(out)).not.toContain("<pre>");
  });

  it("three levels stay nested instead of turning into code", () => {
    const lines = ["- a", "- b", "- c"];
    lines[1] = reindent(lines[1], tabAt(lines, 1, 0));
    lines[2] = reindent(lines[2], tabAt(lines, 2, 0)); // sibling of b now
    lines[2] = reindent(lines[2], tabAt(lines, 2, 2));
    expect(lines).toEqual(["- a", "  - b", "    - c"]);
    const html = renderMarkdown(lines.join("\n"));
    expect(html).not.toContain("<pre>");
    expect(html.match(/<ul>/g)).toHaveLength(3);
  });

  it("an insert inside an item keeps it a list item", () => {
    const action = tabAt(["- item"], 0, 4);
    if (action.kind !== "insert") throw new Error("expected insert");
    const html = renderMarkdown("- ite" + action.text + "m");
    expect(html).toContain("<li>");
    expect(html).not.toContain("<pre>");
  });
});
