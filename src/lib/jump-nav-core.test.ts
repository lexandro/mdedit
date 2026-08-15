import { describe, it, expect } from "vitest";
import {
  back,
  emptyJumpState,
  forward,
  record,
  topForElement,
  type JumpPoint,
} from "./jump-nav-core";

const p = (top: number): JumpPoint => ({ view: "preview", top });

/** The state after jumping `pairs` times, each from/to a preview offset. */
function stack(...pairs: Array<[number, number]>) {
  let s = emptyJumpState();
  for (const [from, to] of pairs) s = record(s, p(from), p(to));
  return s;
}

describe("record", () => {
  it("seeds the stack with origin and destination", () => {
    expect(record(emptyJumpState(), p(0), p(500))).toEqual({
      entries: [p(0), p(500)],
      index: 1,
    });
  });

  it("refreshes the current entry with the live origin", () => {
    // Arrived at 500, scrolled to 540 by hand, then jumped on: back must return
    // to 540, not to the stale 500.
    const s = record(stack([0, 500]), p(540), p(900));
    expect(s.entries).toEqual([p(0), p(540), p(900)]);
    expect(s.index).toBe(2);
  });

  it("drops the forward tail after stepping back", () => {
    const stepped = back(stack([0, 500], [500, 900]))!;
    const s = record(stepped.state, p(500), p(200));
    expect(s.entries).toEqual([p(0), p(500), p(200)]);
    expect(s.index).toBe(2);
    expect(forward(s)).toBeNull();
  });

  it("bounds the stack, keeping the cursor on the newest entry", () => {
    const s = record(record(record(emptyJumpState(), p(0), p(1), 3), p(1), p(2), 3), p(2), p(3), 3);
    expect(s.entries).toEqual([p(1), p(2), p(3)]);
    expect(s.index).toBe(2);
  });
});

describe("back / forward", () => {
  it("retraces a jump and replays it", () => {
    const jumped = stack([0, 500]);
    const b = back(jumped)!;
    expect(b.to).toEqual(p(0));
    const f = forward(b.state)!;
    expect(f.to).toEqual(p(500));
    expect(f.state.index).toBe(jumped.index);
  });

  it("stops at both ends", () => {
    expect(back(emptyJumpState())).toBeNull();
    expect(forward(emptyJumpState())).toBeNull();
    const one = stack([0, 500]);
    expect(forward(one)).toBeNull();
    expect(back(back(one)!.state)).toBeNull();
  });

  it("keeps editor and preview points apart", () => {
    const s = record(emptyJumpState(), { view: "editor", pos: 12 }, { view: "editor", pos: 340 });
    expect(back(s)!.to).toEqual({ view: "editor", pos: 12 });
  });
});

describe("topForElement", () => {
  it("scrolls by the element's distance from the scrollport top", () => {
    expect(topForElement(100, 50, 450, 5000)).toBe(500);
  });

  it("clamps to the scrollable range", () => {
    expect(topForElement(0, 50, 10, 5000)).toBe(0); // element above the port
    expect(topForElement(0, 0, 9000, 5000)).toBe(5000); // past the end
    expect(topForElement(0, 0, 100, -20)).toBe(0); // nothing to scroll
  });
});
