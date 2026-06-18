// Subsequence fuzzy matching for the command palette. Returns a relevance score
// (higher = better) or null when the query is not a subsequence of the text.
export function fuzzyScore(query: string, text: string): number | null {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (q === "") return 1;
  let from = 0;
  let score = 0;
  let prev = -2;
  for (const ch of q) {
    const idx = t.indexOf(ch, from);
    if (idx === -1) return null;
    score += 1;
    if (idx === prev + 1) score += 5; // consecutive run
    if (idx === 0 || /[\s\-_/.]/.test(t[idx - 1])) score += 3; // word boundary
    prev = idx;
    from = idx + 1;
  }
  return score - text.length * 0.01; // tie-break toward shorter labels
}

/** Keep items whose key fuzzily matches the query, sorted best-first. */
export function fuzzyFilter<T>(query: string, items: T[], key: (item: T) => string): T[] {
  return items
    .map((item) => ({ item, score: fuzzyScore(query, key(item)) }))
    .filter((x): x is { item: T; score: number } => x.score !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}
