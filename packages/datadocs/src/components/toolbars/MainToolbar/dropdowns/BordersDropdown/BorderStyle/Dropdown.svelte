<script lang="ts">
  import { getContext } from "svelte";
  import Item from "./Item.svelte";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../../common/dropdown";
  import { BORDER_STYLES } from "../../default";
  import type { BorderStyle } from "../../default";
  import type {
    KeyControlConfig,
    KeyControlActionOptions,
  } from "../../../../../common/key-control/listKeyControl";
  import { keyControlAction } from "../../../../../common/key-control/listKeyControl";
  import { changeBorderStyle } from "../../../../../../app/store/store-toolbar";
  import { borderState } from "../../../../../../app/store/writables";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  let element: HTMLElement;
  const configList: KeyControlConfig[] = [];
  const keyControlOptions: KeyControlActionOptions = {
    configList: configList,
  };

  function handleSelectItem(style: BorderStyle) {
    changeBorderStyle(style);
    closeDropdown();
  }

  $: activeStyle = $borderState.style;
</script>

<div
  class="dropdown"
  bind:this={element}
  use:keyControlAction={keyControlOptions}
>
  {#each BORDER_STYLES as style, index}
    <Item
      {style}
      {activeStyle}
      {index}
      scrollContainer={element}
      {keyControlOptions}
      {handleSelectItem}
    />
  {/each}
</div>

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded p-3 h-[inherit] outline-none overflow-x-hidden overflow-y-auto;
    @apply w-36 flex flex-col;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }
</style>
