import { describe, it, expect } from "vitest";
import { trimClosedStack } from "./tab-history";

const clean = (n: number) => {
  const content = "x".repeat(n); // one string shared by both fields
  return { content, savedContent: content };
};
const dirty = (n: number) => ({ content: "x".repeat(n), savedContent: "y".repeat(n) });

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

  it("counts both buffers of a dirty tab, but a clean tab's only once", () => {
    const cleanStack = [clean(100), clean(100)];
    trimClosedStack(cleanStack, 25, 200);
    expect(cleanStack.length).toBe(2); // 100 + 100 fits

    const dirtyStack = [dirty(100), dirty(100)];
    trimClosedStack(dirtyStack, 25, 200);
    expect(dirtyStack.length).toBe(1); // 200 + 200 does not
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
