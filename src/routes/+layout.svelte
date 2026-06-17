<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { settings } from "$lib/stores/settings.svelte";
  import { recent } from "$lib/stores/recent.svelte";
  import { session } from "$lib/stores/session.svelte";
  import { tabs } from "$lib/stores/tabs.svelte";
  import { listen } from "@tauri-apps/api/event";

  let { children } = $props();

  onMount(() => {
    // settings + recent are independent (separate store files); load them
    // concurrently, then restore the session (which needs the tabs store).
    void (async () => {
      await Promise.all([settings.init(), recent.init()]);
      await session.restore();
    })();

    let unlisten: (() => void) | undefined;
    listen<string>("file-changed", (e) => tabs.handleExternalChange(e.payload))
      .then((fn) => (unlisten = fn))
      .catch(() => {}); // not under Tauri

    const flush = () => void session.flush();
    window.addEventListener("beforeunload", flush);

    return () => {
      unlisten?.();
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
      void t.hadBom;
    }
    session.schedulePersist();
  });
</script>

{@render children()}
