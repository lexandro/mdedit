import { describe, it, expect } from "vitest";
import { RenderCache } from "./render-cache";

const cache = (max: number) => new RenderCache(max);

describe("RenderCache", () => {
  it("computes once per key", () => {
    const c = cache(1000);
    let calls = 0;
    const compute = () => (calls++, "value");
    expect(c.get("k", compute)).toBe("value");
    expect(c.get("k", compute)).toBe("value");
    expect(calls).toBe(1);
  });

  it("evicts the least recently used entry when over budget", () => {
    const c = cache(20); // key + value = 6 chars per entry
    c.get("aaa", () => "AAA");
    c.get("bbb", () => "BBB");
    c.get("ccc", () => "CCC");
    c.get("aaa", () => "!!!"); // still cached, and now most recently used
    expect(c.get("aaa", () => "!!!")).toBe("AAA");

    c.get("ddd", () => "DDD"); // 24 chars > 20, so "bbb" (oldest) goes
    let recomputed = false;
    c.get("bbb", () => ((recomputed = true), "BBB"));
    expect(recomputed).toBe(true);
  });

  it("keeps a single oversized entry rather than emptying itself", () => {
    const c = cache(10);
    c.get("k", () => "x".repeat(500));
    expect(c.size).toBe(1);
    expect(c.get("k", () => "different")).toBe("x".repeat(500));
  });

  it("tracks the character budget across insert and evict", () => {
    const c = cache(1000);
    c.get("ab", () => "cd");
    expect(c.chars).toBe(4);
    c.clear();
    expect(c.chars).toBe(0);
    expect(c.size).toBe(0);
  });

  it("caches nothing when compute throws", () => {
    const c = cache(1000);
    expect(() => c.get("k", () => { throw new Error("boom"); })).toThrow("boom");
    expect(c.size).toBe(0);
    expect(c.get("k", () => "ok")).toBe("ok");
  });
});
