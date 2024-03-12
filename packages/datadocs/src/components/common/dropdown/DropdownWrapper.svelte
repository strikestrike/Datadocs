<script lang="ts">
  import { onMount, tick } from "svelte";
  import Dropdown from "./Dropdown.svelte";

  export let show: boolean = false;
  /**
   * It helps when we want ton show the dropdown around a specific
   * component and not the triggerElement
   */
  export let customTriggerElement: HTMLElement = null;

  let wrapperElement: HTMLElement;
  let triggerElement: HTMLElement;
  let triggerRect: DOMRect;
  let className = "";
  export { className as class };

  async function updateTriggerRect() {
    await tick();
    if (!customTriggerElement && !triggerElement) return;
    triggerRect = (customTriggerElement ?? triggerElement).getBoundingClientRect();
  }

  onMount(() => {
    updateTriggerRect();

    return () => {
      window.removeEventListener("resize", updateTriggerRect);
    }
  });

  // TODO: <Dropdown> component already has a logic to handle resize events.
  // Remove this after making sure `customTriggerElement` doesn't break.
  $: if (show) {
    window.addEventListener("resize", updateTriggerRect);
  } else {
    window.removeEventListener("resize", updateTriggerRect);
  }

  $: if (customTriggerElement) {
    updateTriggerRect();
  }
</script>

<div class={className} bind:this={wrapperElement}>
  <div class="flex items-center" bind:this={triggerElement}>
    <slot name="button" />
  </div>

  {#if show && $$slots.content}
    <Dropdown
      {wrapperElement}
      triggerElement={customTriggerElement ?? triggerElement}
      {triggerRect}
      onClose={() => (show = false)}
      alignment="left"
      {...$$restProps}
    >
      <slot name="content" slot="content" />
    </Dropdown>
  {/if}
</div>
