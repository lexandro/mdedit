// GFM table helpers: insert a table skeleton, and reformat every table in the
// document so its columns are padded and aligned (the painful manual part).
import type { EditorView } from "@codemirror/view";

type Align = "none" | "left" | "center" | "right";

const SEPARATOR = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

function parseAlign(cell: string): Align {
  const c = cell.trim();
  const left = c.startsWith(":");
  const right = c.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  if (left) return "left";
  return "none";
}

function pad(text: string, width: number, align: Align): string {
  const gap = width - text.length;
  if (gap <= 0) return text;
  if (align === "right") return " ".repeat(gap) + text;
  if (align === "center") {
    const l = Math.floor(gap / 2);
    return " ".repeat(l) + text + " ".repeat(gap - l);
  }
  return text + " ".repeat(gap);
}

function sepCell(width: number, align: Align): string {
  switch (align) {
    case "left":
      return ":" + "-".repeat(width - 1);
    case "right":
      return "-".repeat(width - 1) + ":";
    case "center":
      return ":" + "-".repeat(width - 2) + ":";
    default:
      return "-".repeat(width);
  }
}

function formatBlock(lines: string[]): string[] {
  const header = splitRow(lines[0]);
  const aligns = splitRow(lines[1]).map(parseAlign);
  const body = lines.slice(2).map(splitRow);
  const cols = Math.max(header.length, aligns.length, ...body.map((r) => r.length));
  const fit = (r: string[]) => {
    const c = r.slice(0, cols);
    while (c.length < cols) c.push("");
    return c;
  };
  const h = fit(header);
  const rows = body.map(fit);
  const alignOf = (i: number): Align => aligns[i] ?? "none";
  const width = Array.from({ length: cols }, (_, i) =>
    Math.max(3, h[i].length, ...rows.map((r) => r[i].length)),
  );
  const row = (cells: string[]) => "| " + cells.map((c, i) => pad(c, width[i], alignOf(i))).join(" | ") + " |";
  return [
    row(h),
    "| " + width.map((w, i) => sepCell(w, alignOf(i))).join(" | ") + " |",
    ...rows.map(row),
  ];
}

/** Insert an empty 2x1 table at the cursor. */
export function insertTable(view: EditorView): boolean {
  const text = "\n| Column 1 | Column 2 |\n| --- | --- |\n|  |  |\n";
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
    scrollIntoView: true,
    userEvent: "input",
  });
  view.focus();
  return true;
}

/** Reformat every GFM table in a Markdown string (pure; used by the editor and
 *  unit-tested directly). Non-table lines are passed through unchanged. */
export function formatTablesText(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const next = lines[i + 1];
    if (lines[i].includes("|") && next !== undefined && SEPARATOR.test(next)) {
      let end = i + 1;
      while (end + 1 < lines.length && lines[end + 1].includes("|") && lines[end + 1].trim() !== "") {
        end++;
      }
      out.push(...formatBlock(lines.slice(i, end + 1)));
      i = end + 1;
    } else {
      out.push(lines[i]);
      i++;
    }
  }
  return out.join("\n");
}

/** Reformat every GFM table in the document (aligned, padded columns). */
export function formatTables(view: EditorView): boolean {
  const text = view.state.doc.toString();
  const formatted = formatTablesText(text);
  if (formatted === text) return false;
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: formatted },
    userEvent: "input",
  });
  view.focus();
  return true;
}
