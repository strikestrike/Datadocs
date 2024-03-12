<script lang="ts">
  import Icon from "../../../common/icons/Icon.svelte";

  export let node = null;

  export let isHidden = false;

  export let isLocked = false;

  export let layerToggle = (event) => {};

  export let layerLock = (event) => {};

  export let layerDelete = (event) => {};

  function stopMouseDown(event) {
    event.stopPropagation();
  }

  $: {
    console.groupCollapsed("LayerActions");
    console.log("Data " + isHidden);
    console.log("Data " + isHidden);
    console.groupEnd();
  }
</script>

<div class="layer-actions" bind:this={node}>
  {#if layerToggle !== null}
    <div
      class="layer-toggle"
      class:is-hidden={isHidden}
      on:mousedown={stopMouseDown}
      on:click={(event) => layerToggle(event)}
    >
      <Icon icon={"layer-action-toggle"} size="12px" />
    </div>
  {/if}
  {#if layerLock !== null}
    <div
      class="layer-lock"
      class:is-locked={isLocked}
      on:mousedown={stopMouseDown}
      on:click={(event) => layerLock(event)}
    >
      <Icon icon={"layer-action-lock"} size="12px" />
    </div>
  {/if}
  {#if layerDelete !== null}
    <div
      class="layer-delete"
      on:mousedown={stopMouseDown}
      on:click={(event) => layerDelete(event)}
    >
      <Icon icon="layer-action-delete" size="12px" />
    </div>
  {/if}
</div>

<style lang="postcss">
  .layer-actions {
    @apply flex;
  }

  .layer-actions > div {
    @apply mx-0.5 cursor-pointer;
  }

  .layer-actions .layer-toggle {
  }

  .layer-actions .layer-toggle.is-hidden > :global(svg path) {
    fill: black;
  }

  .layer-actions .layer-lock {
  }

  .layer-actions .layer-lock.is-locked > :global(svg path) {
    fill: black;
  }

  .layer-actions .layer-delete {
  }

  .layer-actions .layer-delete :global(svg) {
    fill: red;
  }
</style>
