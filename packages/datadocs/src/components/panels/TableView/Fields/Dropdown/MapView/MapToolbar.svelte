<script lang="ts">
  import Icon from "../../../../../common/icons/Icon.svelte";
  import type { Map } from "leaflet";
  import { onDestroy, onMount } from "svelte";

  export let map: Map;

  let canZoomIn = false;
  let canZoomOut = false;

  let locationStatus: "unknown" | "done" | "error";

  function onZoom() {
    canZoomIn = map.getZoom() < map.getMaxZoom();
    canZoomOut = map.getZoom() > map.getMinZoom();
  }

  function onLocationFound() {
    locationStatus = "done";
  }

  function onLocationError() {
    locationStatus = "error";
  }

  function locate(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    map.locate();
  }

  function toggleLayers(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  function zoomIn(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    map.zoomIn();
  }

  function zoomOut(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    map.zoomOut();
  }

  function stopPropagation(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  onMount(() => {
    map.on("zoom", onZoom);
    map.on("locationfound", onLocationFound);
    map.on("locationerror", onLocationError);
    onZoom();
  });

  onDestroy(() => {
    map.removeEventListener("zoom", onZoom);
    map.removeEventListener("locationfound", onLocationFound);
    map.removeEventListener("locationerror", onLocationError);
  });
</script>

<div class="button-container">
  <div class="button-group">
    <button
      on:dblclick={stopPropagation}
      on:click={locate}
      class:success={locationStatus === "done"}
      class:error={locationStatus === "error"}
    >
      <Icon icon="map-locate" />
    </button>
  </div>

  <div class="button-group">
    <button on:dblclick={stopPropagation} on:click={toggleLayers}>
      <Icon icon="map-layers" />
    </button>
  </div>

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
    @apply flex flex-col;
    row-gap: 2px;
  }

  button {
    @apply flex rounded items-center justify-center h-[18px] w-[18px] text-dark-200;
  }

  button:not(.disabled):hover {
    @apply bg-light-100;
  }

  button.success {
    @apply text-primary-datadocs-blue;
  }

  button.error {
    @apply text-tertiary-error;
  }

  button.disabled {
    @apply text-dark-50;
  }

  .button-group {
    @apply bg-[white] rounded;
    box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.2);
  }
</style>
