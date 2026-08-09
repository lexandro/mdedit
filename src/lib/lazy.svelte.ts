// Component-level code splitting: dialogs and other rarely-used views load on
// first use instead of on launch. `preload()` lets the idle prewarm queue
// (see `prewarm.ts`) fetch them once the app is already interactive.
//
// The component type is inferred from the loader, so props stay type-checked at
// the call site: `{#if open && Dlg.current}<Dlg.current onClose={…} />{/if}`.

export interface Lazy<T> {
  /** The loaded component, or null while its chunk is still in flight. */
  readonly current: T | null;
  /** Start loading without rendering; resolves once the chunk is evaluated. */
  preload(): Promise<void>;
}

export function lazyComponent<T>(load: () => Promise<{ default: T }>): Lazy<T> {
  let comp = $state<T | null>(null);
  let loading: Promise<void> | null = null;

  function start(): Promise<void> {
    // A failed chunk fetch must not take the app down; clearing `loading` lets
    // reopening the dialog retry the import.
    loading ??= load()
      .then((m) => void (comp = m.default))
      .catch(() => void (loading = null));
    return loading;
  }

  return {
    get current() {
      void start();
      return comp;
    },
    preload: start,
  };
}
