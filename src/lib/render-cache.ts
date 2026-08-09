// Byte-bounded LRU for rendered HTML fragments.
//
// Live mode rebuilds its block and math widgets on every cursor move, so this
// cache is what keeps that affordable. Bounding it by entry count is not enough:
// a single 5000-line fenced block stores both its source (the key) and its
// highlighted HTML (the value), so 256 entries is unbounded in bytes.

export class RenderCache {
  // Map iterates in insertion order, so the first key is the least recently used.
  #entries = new Map<string, string>();
  #chars = 0;
  readonly #maxChars: number;

  constructor(maxChars = 1_000_000) {
    this.#maxChars = maxChars;
  }

  get size(): number {
    return this.#entries.size;
  }

  get chars(): number {
    return this.#chars;
  }

  /** The cached value for `key`, computing and storing it on a miss. A throwing
   *  `compute` caches nothing, so the caller can retry. */
  get(key: string, compute: () => string): string {
    const hit = this.#entries.get(key);
    if (hit !== undefined) {
      this.#entries.delete(key); // re-insert to mark it most recently used
      this.#entries.set(key, hit);
      return hit;
    }

    const value = compute();
    this.#entries.set(key, value);
    this.#chars += key.length + value.length;

    // Keep one entry even when it alone busts the budget: a document whose
    // single block is oversized should still hit the cache within one rebuild.
    for (const oldest of this.#entries.keys()) {
      if (this.#chars <= this.#maxChars || this.#entries.size <= 1) break;
      this.#chars -= oldest.length + this.#entries.get(oldest)!.length;
      this.#entries.delete(oldest);
    }
    return value;
  }

  clear(): void {
    this.#entries.clear();
    this.#chars = 0;
  }
}
