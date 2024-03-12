<script lang="ts">
  import { tick } from "svelte";
  import { activeAlternatingColors } from "./default";
  import type { AlternatingColor } from "./default";
  import { getColorFromValue } from "../../../../../app/store/store-toolbar";
  import type {
    GridKeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../common/key-control/gridKeyControl";
  import { registerElement } from "../../../../common/key-control/gridKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";

  export let data: AlternatingColor;
  export let handleSelectAlternatingColor: (v: string) => void;
  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let ridx: number;
  export let cidx: number;
  export let scrollContainer: HTMLElement;

  const alternatingPattern: string[] = [];
  const numberOfRow = 5;
  let isSelected = false;
  let element: HTMLButtonElement;

  function generatePartern() {
    if (!data) return;
    const hasHeader = !!data.header;
    const hasFooter = !!data.footer;
    alternatingPattern[0] = hasHeader ? data.header : data.oddRow;
    if (hasFooter) {
      alternatingPattern[numberOfRow - 1] = data.footer;
    }
    for (let i = 1; i < numberOfRow; i++) {
      if (i === numberOfRow - 1 && hasFooter) continue;
      let partern = "";
      if (hasHeader) {
        partern = i % 2 === 0 ? data.evenRow : data.oddRow;
      } else {
        partern = i % 2 === 0 ? data.oddRow : data.evenRow;
      }
      alternatingPattern[i] = partern;
    }
  }

  async function onSelectCallback(byKey = true) {
    isSelected = true;
    element.focus();
    if (!byKey) return;
    await tick();
    scrollVerticalToVisible(scrollContainer, element);
  }

  function onDeselectCallback() {
    if (document.activeElement === element) element.blur();
    isSelected = false;
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

  $: activeColor = $activeAlternatingColors;
  $: isActive = data.name === activeColor.value;
  $: if (data) generatePartern();
</script>

<div
  class="color-container"
  class:active={isActive}
  class:selected={isSelected}
>
  <button
    class="relative block w-full h-full rounded overflow-hidden border-none outline-none"
    on:click={() => handleSelectAlternatingColor(data.name)}
    bind:this={element}
    use:registerElement={options}
    tabindex={-1}
  >
    <div class="flex flex-col w-full h-full">
      {#each alternatingPattern as pattern}
        <div
          class="flex-grow flex-shrink w-full"
          style="background-color: {getColorFromValue(pattern)};"
        />
      {/each}
    </div>
  </button>
</div>

<style lang="postcss">
  .color-container {
    @apply relative w-full h-[30px];
  }

  .color-container.selected::before,
  .color-container.active::before {
    @apply absolute -top-1 -bottom-1 -left-1 -right-1 border-[2.5px] rounded-lg border-solid border-primary-datadocs-blue bg-transparent pointer-events-none;
    z-index: 10;
    content: "";
  }
</style>
