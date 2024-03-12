<script lang="ts">
  import Icon from "../../../../../../common/icons/Icon.svelte";
  import { onDestroy, onMount } from "svelte";

  export let map: google.maps.Map;

  let canZoomIn = false;
  let canZoomOut = false;

  const listenerHandles: google.maps.MapsEventListener[] = [];

  function onZoom() {
    canZoomOut = map.getZoom() > 0;
    canZoomIn = map.getZoom() < 18;
  }

  function zoomIn(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    map.setZoom(map.getZoom() + 1);
  }

  function zoomOut(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    map.setZoom(map.getZoom() - 1);
  }

  function stopPropagation(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  onMount(() => {
    listenerHandles.push(map.addListener("zoom_changed", onZoom));
    onZoom();
  });

  onDestroy(() => {
    listenerHandles.forEach((handle) => handle.remove());
    listenerHandles.length = 0;
  });
</script>

<div class="button-container">
  <div class="button-group">
    <button
      on:click={zoomIn}
      on:dblclick={stopPropagation}
      class:disabled={!canZoomIn}
    >
      <Icon icon="map-zoom-in" />
    </button>
    <button
      on:click={zoomOut}
      on:dblclick={stopPropagation}
      class:disabled={!canZoomOut}
    >
      <Icon icon="map-zoom-out" />
    </button>
  </div>
</div>

<style lang="postcss">
  .button-container {
    @apply flex flex-col m-1;
    row-gap: 2px;
  }

  button {
    @apply flex rounded-sm items-center justify-center h-[18px] w-[18px] text-dark-200;
  }

  button:not(.disabled):hover {
    @apply bg-light-100;
  }

  button.disabled {
    @apply text-dark-50 pointer-events-none;
  }

  .button-group {
    @apply bg-[white] rounded-sm;
    box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.2);
  }
</style>
