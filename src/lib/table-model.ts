// Structured GFM table model: parse table lines into { aligns, cells }, edit,
// and serialize back to formatted Markdown. Cell text is stored UNESCAPED
// (a literal `|`); serialization re-escapes. Pure module — no imports.

export type Align = "none" | "left" | "center" | "right";

/** cells[0] is the header row; every row has aligns.length cells. */
export interface TableModel {
  aligns: Align[];
  cells: string[][];
}

export const SEPARATOR = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

/** Split a row on unescaped pipes; `\|` becomes a literal `|` in the cell.
 *  Optional leading/trailing pipes are stripped, cells trimmed. */
export function splitCells(line: string): string[] {
  const s = line.trim();
  const cells: string[] = [];
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && s[i + 1] === "|") {
      cur += "|";
      i++;
    } else if (s[i] === "|") {
      cells.push(cur);
      cur = "";
    } else {
      cur += s[i];
    }
  }
  cells.push(cur);
  if (cells.length > 1 && s.startsWith("|")) cells.shift();
  if (cells.length > 1 && s.endsWith("|") && !s.endsWith("\\|")) cells.pop();
  return cells.map((c) => c.trim());
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

function escapeCell(text: string): string {
  return text.replace(/\|/g, "\\|");
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

/** Parse a table block (header, separator, body lines) into a normalized
 *  model: ragged rows are padded to the widest row's column count. */
export function parseTableBlock(lines: string[]): TableModel {
  const header = splitCells(lines[0]);
  const aligns = splitCells(lines[1]).map(parseAlign);
  const body = lines.slice(2).map(splitCells);
  const cols = Math.max(header.length, aligns.length, ...body.map((r) => r.length));
  const fit = (r: string[]) => {
    const c = r.slice(0, cols);
    while (c.length < cols) c.push("");
    return c;
  };
  const fitAligns = aligns.slice(0, cols);
  while (fitAligns.length < cols) fitAligns.push("none");
  return { aligns: fitAligns, cells: [fit(header), ...body.map(fit)] };
}

/** Serialize to formatted, padded GFM lines. Pads on the ESCAPED cell text so
 *  columns stay aligned; min column width 3 (room for `:-:`). */
export function serializeTable(t: TableModel): string[] {
  const rows = t.cells.map((r) => r.map(escapeCell));
  const width = t.aligns.map((_, i) =>
    Math.max(3, ...rows.map((r) => r[i].length)),
  );
  const row = (cells: string[]) =>
    "| " + cells.map((c, i) => pad(c, width[i], t.aligns[i])).join(" | ") + " |";
  return [
    row(rows[0]),
    "| " + width.map((w, i) => sepCell(w, t.aligns[i])).join(" | ") + " |",
    ...rows.slice(1).map(row),
  ];
}

/** Fresh all-empty model: `rows` total rows (cells[0] = header), `cols` columns. */
export function emptyTable(rows: number, cols: number): TableModel {
  return {
    aligns: Array.from({ length: cols }, () => "none" as Align),
    cells: Array.from({ length: rows }, () => Array.from({ length: cols }, () => "")),
  };
}

/** Locate the table block containing `offset` (same block rule as
 *  formatTablesText). Returns character offsets: `from` = start of the header
 *  line, `to` = end of the last line (no trailing newline), inclusive
 *  from <= offset <= to. Null when the offset is not inside a table. */
export function findTableAt(text: string, offset: number): { from: number; to: number } | null {
  const lines = text.split("\n");
  let pos = 0;
  let i = 0;
  while (i < lines.length) {
    const next = lines[i + 1];
    if (lines[i].includes("|") && next !== undefined && SEPARATOR.test(next)) {
      let end = i + 1;
      let endPos = pos + lines[i].length + 1 + lines[i + 1].length;
      while (end + 1 < lines.length && lines[end + 1].includes("|") && lines[end + 1].trim() !== "") {
        end++;
        endPos += 1 + lines[end].length;
      }
      if (offset >= pos && offset <= endPos) return { from: pos, to: endPos };
      if (offset < pos) return null;
      for (let j = i; j <= end; j++) pos += lines[j].length + 1;
      i = end + 1;
    } else {
      pos += lines[i].length + 1;
      i++;
    }
  }
  return null;
}
