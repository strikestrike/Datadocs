<script lang="ts">
  import { onMount, tick } from "svelte";
  import Switch from "../../../../common/form/Switch.svelte";
  import type {
    GridKeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../common/key-control/gridKeyControl";
  import { registerElement } from "../../../../common/key-control/gridKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";

  export let on: boolean;
  export let label: string;
  export let ridx: number;
  export let cidx: number;
  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let scrollContainer: HTMLElement;

  let isSelected = false;
  let inputElement: HTMLInputElement;
  let containerElement: HTMLElement;

  async function onSelectCallback(byKey = true) {
    isSelected = true;
    if (inputElement) inputElement.focus();
    if (!byKey) return;
    await tick();
    scrollVerticalToVisible(scrollContainer, containerElement);
  }

  function onDeselectCallback() {
    isSelected = false;
    if (inputElement && document.activeElement === inputElement)
      inputElement.blur();
  }

  const options: RegisterElementOptions = {
    gridKeyControlOptions,
    ridx,
    cidx,
    config: {
      ridx,
      cidx,
      isSelected,
      onDeselectCallback,
      onSelectCallback,
    },
  };

  onMount(() => {
    inputElement = containerElement.querySelector("input");
  });
</script>

<div
  bind:this={containerElement}
  class="flex flex-row items-center space-x-4 font-medium"
  class:selected={isSelected}
>
  <span>{label}</span>
  <div
    class="switch-container relative w-[30px] h-5"
    class:on
    use:registerElement={options}
  >
    <Switch bind:on />
  </div>
</div>

<style lang="postcss">
  .selected .switch-container :global(.switch-bar) {
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
    filter: brightness(95%);
  }

  .selected .switch-container.on :global(.switch-bar) {
    box-shadow: 0px 5px 20px rgba(8, 185, 255, 0.2);
    filter: brightness(110%);
  }
</style>
