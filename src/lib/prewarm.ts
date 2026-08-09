// Warm lazily-imported modules once the app is already interactive, so the
// first Mermaid diagram or HTML paste doesn't pay the download+parse cost.
//
// Fetching a chunk is off the main thread, but *evaluating* it is not — so the
// queue runs one task per idle slot rather than firing them all at once, and
// callers order the list cheapest-first (see the call site in +layout.svelte).

type Task = () => Promise<unknown>;

const onIdle: (cb: () => void) => void =
  typeof requestIdleCallback === "function"
    ? (cb) => void requestIdleCallback(() => cb(), { timeout: 2000 })
    : (cb) => void setTimeout(cb, 200);

/** Run `tasks` sequentially during idle time. Returns a cancel function. */
export function prewarm(tasks: Task[]): () => void {
  let cancelled = false;
  let next = 0;

  function step() {
    if (cancelled || next >= tasks.length) return;
    const task = tasks[next++];
    onIdle(() => {
      if (cancelled) return;
      Promise.resolve()
        .then(task)
        .catch(() => {}) // a warm-up failure is invisible; the real call retries
        .then(step);
    });
  }

  step();
  return () => {
    cancelled = true;
  };
}
