// Pure shortcode search for the emoji picker. Prefix matches rank above
// substring matches; results are capped for rendering performance.
export interface Emoji {
  shortcode: string;
  char: string;
}

export function filterEmoji(query: string, list: Emoji[], limit = 120): Emoji[] {
  const q = query.trim().toLowerCase();
  if (!q) return list.slice(0, limit);
  const prefix: Emoji[] = [];
  const contains: Emoji[] = [];
  for (const e of list) {
    const i = e.shortcode.indexOf(q);
    if (i === 0) prefix.push(e);
    else if (i > 0) contains.push(e);
  }
  return [...prefix, ...contains].slice(0, limit);
}
