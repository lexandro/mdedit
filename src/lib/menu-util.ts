// Pure helpers for keyboard menu navigation. A row is the item's label when the
// user can land on it, and null for separators and disabled placeholders.
export type MenuRow = string | null;

/**
 * Next selectable row from `from`, wrapping. Pass -1 to start before the first
 * row and `rows.length` to start after the last. -1 when nothing is selectable.
 */
export function nextRow(rows: MenuRow[], from: number, dir: 1 | -1): number {
  const n = rows.length;
  let i = from;
  for (let step = 0; step < n; step++) {
    i = (((i + dir) % n) + n) % n;
    if (rows[i] != null) return i;
  }
  return -1;
}

/** Type-ahead: next row after `from` whose label starts with `key`, wrapping. */
export function rowByLetter(rows: MenuRow[], key: string, from: number): number {
  const k = key.toLowerCase();
  const n = rows.length;
  for (let step = 1; step <= n; step++) {
    const i = (((from + step) % n) + n) % n;
    if (rows[i]?.[0]?.toLowerCase() === k) return i;
  }
  return -1;
}

/** Menu whose access key (its first letter) matches a pressed Alt+key. */
export function mnemonicIndex(labels: string[], key: string): number {
  return rowByLetter(labels, key, -1);
}
