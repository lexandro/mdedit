// Pure keyboard-navigation map for the table editor grid: keydown in cell
// (r, c) -> which cell to focus next. Null = let the input handle the key.
export type NavTarget = { r: number; c: number } | "appendRow" | null;

/** Tab walks cells row-major and wraps rows; on the very last cell it asks the
 *  grid to append a row. Enter moves down. Arrows move without wrapping, and
 *  Left/Right only leave the cell when the caret sits at the input's
 *  start/end, so in-cell text editing keeps working. */
export function navTarget(
  key: string,
  shift: boolean,
  r: number,
  c: number,
  rows: number,
  cols: number,
  atStart: boolean,
  atEnd: boolean,
): NavTarget {
  switch (key) {
    case "Tab": {
      if (shift) {
        if (c > 0) return { r, c: c - 1 };
        return r > 0 ? { r: r - 1, c: cols - 1 } : null;
      }
      if (c < cols - 1) return { r, c: c + 1 };
      return r < rows - 1 ? { r: r + 1, c: 0 } : "appendRow";
    }
    case "Enter":
      return r < rows - 1 ? { r: r + 1, c } : null;
    case "ArrowUp":
      return r > 0 ? { r: r - 1, c } : null;
    case "ArrowDown":
      return r < rows - 1 ? { r: r + 1, c } : null;
    case "ArrowLeft":
      return atStart && c > 0 ? { r, c: c - 1 } : null;
    case "ArrowRight":
      return atEnd && c < cols - 1 ? { r, c: c + 1 } : null;
    default:
      return null;
  }
}
