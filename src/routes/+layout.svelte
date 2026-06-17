<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { settings } from "$lib/stores/settings.svelte";
  import { recent } from "$lib/stores/recent.svelte";
  import { tabs } from "$lib/stores/tabs.svelte";
  import { listen } from "@tauri-apps/api/event";

  let { children } = $props();

  onMount(() => {
    void settings.init();
    void recent.init();

    let unlisten: (() => void) | undefined;
    listen<string>("file-changed", (e) => tabs.handleExternalChange(e.payload))
      .then((fn) => (unlisten = fn))
      .catch(() => {}); // not under Tauri
    return () => unlisten?.();
  });
</script>

{@render children()}
