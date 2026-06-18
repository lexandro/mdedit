<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { settings } from "$lib/stores/settings.svelte";
  import { recent } from "$lib/stores/recent.svelte";
  import { session } from "$lib/stores/session.svelte";
  import { updater } from "$lib/stores/updater.svelte";
  import { tabs } from "$lib/stores/tabs.svelte";
  import { takeLaunchFiles } from "$lib/ipc";
  import { listen } from "@tauri-apps/api/event";
  import { getCurrentWebview } from "@tauri-apps/api/webview";
  import { getCurrentWindow } from "@tauri-apps/api/window";

  let { children } = $props();

  const TEXT_EXT = /\.(md|markdown|mdown|mkd|mdx|txt)$/i;

  function openPaths(paths: string[]) {
    for (const p of paths) if (TEXT_EXT.test(p)) void tabs.openPath(p);
  }

  onMount(() => {
    const unlisteners: Array<() => void> = [];

    // settings + recent are independent (separate store files); load them
    // concurrently, then restore the session, then open any launch files.
    void (async () => {
      await Promise.all([settings.init(), recent.init()]);
      // Apply the startup window state (maximized by default; the OS window
      // already opens maximized, so this only matters when set to normal).
      const win = getCurrentWindow();
      (settings.startupMaximized ? win.maximize() : win.unmaximize()).catch(() => {});
      await session.restore();
      openPaths(await takeLaunchFiles());
    })();

    updater.startAutoCheck();

    // A second instance ("Open with" on another file) forwards its files here.
    listen<string[]>("open-files", (e) => openPaths(e.payload))
      .then((fn) => unlisteners.push(fn))
      .catch(() => {});

    listen<string>("file-changed", (e) => tabs.handleExternalChange(e.payload))
      .then((fn) => unlisteners.push(fn))
      .catch(() => {}); // not under Tauri

    // Files dropped onto the window.
    getCurrentWebview()
      .onDragDropEvent((e) => {
        if (e.payload.type === "drop") openPaths(e.payload.paths);
      })
      .then((fn) => unlisteners.push(fn))
      .catch(() => {});

    const flush = () => void session.flush();
    window.addEventListener("beforeunload", flush);

    return () => {
      unlisteners.forEach((fn) => fn());
      window.removeEventListener("beforeunload", flush);
    };
  });

  // Persist the session whenever the open tabs (or their buffers) change.
  $effect(() => {
    void tabs.activeId;
    for (const t of tabs.tabs) {
      void t.path;
      void t.content;
      void t.viewMode;
      void t.lineEnding;
      void t.encoding;
    }
    session.schedulePersist();
  });
</script>

{@render children()}
