// Pure row/column operations over a TableModel. Every op returns a new model
// (or the input unchanged for no-ops); cells[0] (the header) never moves.
import { moveItem } from "./array-util";
import type { Align, TableModel } from "./table-model";

const blank = (cols: number) => Array.from({ length: cols }, () => "");

/** Insert a blank body row at `at` (>= 1; the header cannot be displaced). */
export function addRow(t: TableModel, at: number): TableModel {
  if (at < 1 || at > t.cells.length) return t;
  const cells = t.cells.slice();
  cells.splice(at, 0, blank(t.aligns.length));
  return { aligns: t.aligns, cells };
}

/** Remove a body row; the header (index 0) is kept — header-only is legal GFM. */
export function removeRow(t: TableModel, at: number): TableModel {
  if (at < 1 || at >= t.cells.length) return t;
  return { aligns: t.aligns, cells: t.cells.filter((_, i) => i !== at) };
}

/** Move a body row (both indices >= 1); out-of-range moves are no-ops. */
export function moveRow(t: TableModel, from: number, to: number): TableModel {
  if (from < 1 || to < 1) return t;
  const cells = moveItem(t.cells, from, to);
  return cells === t.cells ? t : { aligns: t.aligns, cells };
}

/** Insert a blank column at `at` in every row (align "none"). */
export function addCol(t: TableModel, at: number): TableModel {
  if (at < 0 || at > t.aligns.length) return t;
  const aligns = t.aligns.slice();
  aligns.splice(at, 0, "none");
  const cells = t.cells.map((r) => {
    const row = r.slice();
    row.splice(at, 0, "");
    return row;
  });
  return { aligns, cells };
}

/** Remove a column; the last remaining column cannot be removed. */
export function removeCol(t: TableModel, at: number): TableModel {
  if (at < 0 || at >= t.aligns.length || t.aligns.length === 1) return t;
  return {
    aligns: t.aligns.filter((_, i) => i !== at),
    cells: t.cells.map((r) => r.filter((_, i) => i !== at)),
  };
}

/** Move a column (aligns + every row); out-of-range moves are no-ops. */
export function moveCol(t: TableModel, from: number, to: number): TableModel {
  const aligns = moveItem(t.aligns, from, to);
  if (aligns === t.aligns) return t;
  return { aligns, cells: t.cells.map((r) => moveItem(r, from, to)) };
}

/** Set a column's alignment. */
export function setAlign(t: TableModel, col: number, a: Align): TableModel {
  if (col < 0 || col >= t.aligns.length) return t;
  return { aligns: t.aligns.map((x, i) => (i === col ? a : x)), cells: t.cells };
}
