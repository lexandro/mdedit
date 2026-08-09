// "Reopen closed tab" history. Bounded by characters as well as entries: 25
// closed large documents would otherwise stay in memory indefinitely.

const CLOSED_MAX_ENTRIES = 25;
const CLOSED_MAX_CHARS = 5_000_000; // ~10 MB of UTF-16 across the stack

interface Buffers {
  content: string;
  savedContent: string;
}

/** Characters a closed tab retains. A clean tab shares one string between the
 *  two fields, so it is only counted once. */
function closedTabChars(t: Buffers): number {
  return t.content.length + (t.savedContent === t.content ? 0 : t.savedContent.length);
}

/** Drop oldest entries until the stack fits both budgets. Never empties it —
 *  the most recent close must always be reopenable. Mutates and returns `stack`. */
export function trimClosedStack<T extends Buffers>(
  stack: T[],
  maxEntries = CLOSED_MAX_ENTRIES,
  maxChars = CLOSED_MAX_CHARS,
): T[] {
  while (stack.length > maxEntries) stack.shift();
  let chars = stack.reduce((sum, t) => sum + closedTabChars(t), 0);
  while (chars > maxChars && stack.length > 1) {
    chars -= closedTabChars(stack.shift()!);
  }
  return stack;
}
