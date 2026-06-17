<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { settings } from "$lib/stores/settings.svelte";
  import { recent } from "$lib/stores/recent.svelte";

  let { children } = $props();

  onMount(() => {
    void settings.init();
    void recent.init();
  });
</script>

{@render children()}
