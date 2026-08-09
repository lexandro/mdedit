import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prewarm } from "./prewarm";

// jsdom has no requestIdleCallback, so these exercise the setTimeout fallback.
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("prewarm", () => {
  it("runs tasks one at a time, in order", async () => {
    const order: number[] = [];
    prewarm([0, 1, 2].map((i) => () => Promise.resolve(order.push(i))));

    await vi.advanceTimersByTimeAsync(200);
    expect(order).toEqual([0]); // one idle slot, one task
    await vi.advanceTimersByTimeAsync(400);
    expect(order).toEqual([0, 1, 2]);
  });

  it("keeps going after a task rejects", async () => {
    const ran: string[] = [];
    prewarm([() => Promise.reject(new Error("boom")), () => Promise.resolve(ran.push("second"))]);

    await vi.advanceTimersByTimeAsync(400);
    expect(ran).toEqual(["second"]);
  });

  it("stops after cancel", async () => {
    const ran: number[] = [];
    const cancel = prewarm([0, 1, 2].map((i) => () => Promise.resolve(ran.push(i))));

    await vi.advanceTimersByTimeAsync(200);
    cancel();
    await vi.advanceTimersByTimeAsync(1000);
    expect(ran).toEqual([0]);
  });
});
