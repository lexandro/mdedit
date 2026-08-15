// Browser-style back/forward over in-document jumps (anchor links, outline,
// go-to-line). Recording happens only in the record*/jumpToLine entry points,
// all driven by a user event; restoring runs through apply(), which never
// records — that separation is what keeps back/forward from feeding itself.
import type { EditorView } from "@codemirror/view";
import { getActiveView, goToLine, revealPos } from "$lib/editor-commands";
import {
  back,
  emptyJumpState,
  forward,
  record,
  topForElement,
  type JumpPoint,
  type JumpState,
  type JumpStep,
} from "$lib/jump-nav-core";
import { clamp } from "$lib/settings-util";
import { tabs } from "$lib/stores/tabs.svelte";
import { toasts } from "$lib/stores/toasts.svelte";
import { t } from "$lib/i18n";

let activePreview: HTMLElement | null = null;

export function setActivePreview(el: HTMLElement) {
  activePreview = el;
}

export function clearActivePreview(el: HTMLElement) {
  if (activePreview === el) activePreview = null;
}

// One stack per tab: a position only means something inside its own document.
const states = new Map<number, JumpState>();

function maxScroll(el: HTMLElement): number {
  return Math.max(el.scrollHeight - el.clientHeight, 0);
}

function currentState(): JumpState | null {
  const id = tabs.activeId;
  return id == null ? null : (states.get(id) ?? null);
}

function push(from: JumpPoint, to: JumpPoint) {
  const id = tabs.activeId;
  if (id == null) return;
  states.set(id, record(states.get(id) ?? emptyJumpState(), from, to));
}

/** The element carrying `id`, scanned rather than selected: ids come from the
 *  document's own text, so escaping them into a selector is a bug waiting to
 *  happen (and CSS.escape isn't universal). */
export function anchorTarget(container: HTMLElement, id: string): Element | undefined {
  return [...container.querySelectorAll("[id]")].find((el) => el.id === id);
}

/** Record a preview anchor jump. Must run *before* the scroll: with reduced
 *  motion `scrollIntoView` is synchronous, so afterwards the origin is gone. */
export function recordPreviewJump(container: HTMLElement, target: Element) {
  const top = topForElement(
    container.scrollTop,
    container.getBoundingClientRect().top,
    target.getBoundingClientRect().top,
    maxScroll(container),
  );
  push({ view: "preview", top: container.scrollTop }, { view: "preview", top, anchor: target.id });
}

/** Record an editor jump that already happened, `fromPos` being its origin. A
 *  jump that moved nowhere (line out of range, heading missing) records nothing. */
export function recordEditorJump(view: EditorView, fromPos: number) {
  const pos = view.state.selection.main.head;
  if (pos === fromPos) return;
  push({ view: "editor", pos: fromPos }, { view: "editor", pos });
}

/** Go to a 1-based line, remembering where the jump started. */
export function jumpToLine(line: number) {
  const view = getActiveView();
  if (!view) return;
  const from = view.state.selection.main.head;
  goToLine(line);
  recordEditorJump(view, from);
}

/** Restore a recorded position. False when its view isn't on screen. */
function apply(p: JumpPoint): boolean {
  if (p.view === "preview") {
    if (!activePreview) return false;
    // Instant, like a browser's back button — and it lets the split-view scroll
    // sync drag the editor along, exactly as the original jump did.
    const target = p.anchor ? anchorTarget(activePreview, p.anchor) : undefined;
    if (target) target.scrollIntoView({ behavior: "auto", block: "start" });
    else activePreview.scrollTop = clamp(p.top, 0, maxScroll(activePreview));
    return true;
  }
  const view = getActiveView();
  if (!view) return false;
  revealPos(view, Math.min(p.pos, view.state.doc.length)); // the doc may have shrunk
  view.focus();
  return true;
}

function step(pick: (s: JumpState) => JumpStep | null) {
  const id = tabs.activeId;
  const state = currentState();
  if (id == null || !state) return;
  const next = pick(state);
  if (!next) return; // end of the stack: a browser just greys the button out
  if (!apply(next.to)) {
    toasts.show(t("toast.jumpUnavailable"), "info");
    return; // the cursor only moves when the jump actually happened
  }
  states.set(id, next.state);
}

export function jumpBack() {
  step(back);
}

export function jumpForward() {
  step(forward);
}

export function canGoBack(): boolean {
  const s = currentState();
  return s !== null && back(s) !== null;
}

export function canGoForward(): boolean {
  const s = currentState();
  return s !== null && forward(s) !== null;
}

/** Mouse side buttons: 3 = back, 4 = forward in Chromium/WebView2. */
export function mouseNav(e: MouseEvent) {
  if (e.button !== 3 && e.button !== 4) return;
  e.preventDefault(); // the webview would otherwise navigate its own history
  if (e.type !== "mousedown") return; // auxclick is only suppressed
  if (e.button === 3) jumpBack();
  else jumpForward();
}

/** Drop the stacks of tabs that no longer exist. */
export function pruneJumpHistory(liveIds: number[]) {
  for (const id of states.keys()) if (!liveIds.includes(id)) states.delete(id);
}
