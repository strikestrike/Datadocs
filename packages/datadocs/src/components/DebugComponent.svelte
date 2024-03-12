<script lang="ts">
  import { writable } from "svelte/store";
  import AsyncSelector from "./common/selector/AsyncSelector.svelte";
  import { onMount } from "svelte";

  const selectedId = writable<number | undefined>();
  const items = writable<{ id: number; title: string; subtitle: string }[]>([]);
  const loading = writable<boolean>(true);
  onMount(() => {
    setTimeout(() => {
      loading.set(false);
      items.set([
        { id: 100, title: "Item100", subtitle: "Subtitle" },
        { id: 110, title: "Item110", subtitle: "Subtitle" },
        { id: 120, title: "Item120", subtitle: "Subtitle" },
      ]);
    }, 2000);
  });
  function onSelect(ev: CustomEvent<{id: any}>) {
    selectedId.set(ev.detail.id);
  }
</script>

<div class="p-8">
  <AsyncSelector
    selectedId={$selectedId}
    loading={$loading}
    items={$items}
    on:select={onSelect}
  />
</div>

<style lang="postcss">
</style>
