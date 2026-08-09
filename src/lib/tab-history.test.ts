import { describe, it, expect } from "vitest";
import { closedTabChars, trimClosedStack } from "./tab-history";

const clean = (n: number) => {
  const content = "x".repeat(n);
  return { content, savedContent: content };
};
const dirty = (n: number) => ({ content: "x".repeat(n), savedContent: "y".repeat(n) });

describe("closedTabChars", () => {
  it("counts a clean tab's shared buffer once", () => {
    expect(closedTabChars(clean(100))).toBe(100);
  });
  it("counts both buffers of a dirty tab", () => {
    expect(closedTabChars(dirty(100))).toBe(200);
  });
});

describe("trimClosedStack", () => {
  it("caps the entry count, dropping oldest first", () => {
    const stack = Array.from({ length: 5 }, (_, i) => ({ ...clean(1), id: i }));
    trimClosedStack(stack, 3, 1_000_000);
    expect(stack.map((t) => t.id)).toEqual([2, 3, 4]);
  });

  it("caps total characters even when the entry count fits", () => {
    const stack = [clean(100), clean(100), clean(100)];
    trimClosedStack(stack, 25, 250);
    expect(stack.length).toBe(2);
  });

  it("keeps the most recent entry however large it is", () => {
    const stack = [clean(10), clean(1_000_000)];
    trimClosedStack(stack, 25, 100);
    expect(stack.length).toBe(1);
    expect(stack[0].content.length).toBe(1_000_000);
  });

  it("leaves a stack that fits both budgets alone", () => {
    const stack = [clean(10), clean(20)];
    trimClosedStack(stack, 25, 1_000_000);
    expect(stack.length).toBe(2);
  });
});
