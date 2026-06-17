<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { settings } from "$lib/stores/settings.svelte";

  let { children } = $props();

  onMount(() => {
    void settings.init();
  });
</script>

{@render children()}
