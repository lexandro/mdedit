// Back/forward stack for in-document jumps. A list of positions plus a cursor:
// `entries[index]` is where the user stands now, everything after it is the
// forward tail. Pure: the DOM/editor side lives in jump-nav.ts.
import { clamp } from "$lib/settings-util";

// A preview destination carries the heading id it aimed at: the pane re-renders
// (debounced Markdown, Mermaid, late reflow) and the browser then re-anchors the
// scroll, which leaves a plain pixel offset pointing at the wrong place. `top`
// stays as the fallback for when that heading is gone from the document.
export type JumpPoint =
  | { view: "preview"; top: number; anchor?: string }
  | { view: "editor"; pos: number };

export interface JumpState {
  entries: JumpPoint[];
  index: number;
}

export interface JumpStep {
  state: JumpState;
  to: JumpPoint;
}

const MAX_ENTRIES = 50;

export function emptyJumpState(): JumpState {
  return { entries: [], index: -1 };
}

/** Refresh the current entry with the live origin (the user may have scrolled
 *  since arriving), drop the forward tail, then push the destination. */
export function record(
  state: JumpState,
  from: JumpPoint,
  to: JumpPoint,
  max = MAX_ENTRIES,
): JumpState {
  const entries = [...state.entries.slice(0, Math.max(state.index, 0)), from, to];
  let index = entries.length - 1;
  while (entries.length > max) {
    entries.shift();
    index--;
  }
  return { entries, index };
}

/** Step to the previous position, or null at the oldest entry. */
export function back(state: JumpState): JumpStep | null {
  if (state.index <= 0) return null;
  const index = state.index - 1;
  return { state: { entries: state.entries, index }, to: state.entries[index] };
}

/** Step to the next position, or null at the newest entry. */
export function forward(state: JumpState): JumpStep | null {
  if (state.index < 0 || state.index >= state.entries.length - 1) return null;
  const index = state.index + 1;
  return { state: { entries: state.entries, index }, to: state.entries[index] };
}

/** The scroll offset that puts an element's top at the scrollport's top — what
 *  `scrollIntoView({ block: "start" })` does, computed before it animates. */
export function topForElement(
  scrollTop: number,
  portTop: number,
  elementTop: number,
  maxTop: number,
): number {
  return clamp(scrollTop + elementTop - portTop, 0, Math.max(maxTop, 0));
}
