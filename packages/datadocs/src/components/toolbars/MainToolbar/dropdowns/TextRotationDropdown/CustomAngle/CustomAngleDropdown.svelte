<script lang="ts">
  import { getContext, onDestroy } from "svelte";
  import { changeTextRotationValue } from "../../../../../../app/store/store-toolbar";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../../common/dropdown";
  import { UPDATE_CUSTOM_ANGLE_INPUT } from "../constant";
  import CustomAngleElement from "./CustomAngleElement.svelte";
  import { keyControlAction } from "../../../../../common/key-control/listKeyControl";
  import type {
    KeyControlConfig,
    KeyControlActionOptions,
  } from "../../../../../common/key-control/listKeyControl";
  import { textRotationValue } from "../../../../../../app/store/writables";

  export let updateInputValue: (v: string) => void;

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  const changeTextRotationInput: (value: number) => void = getContext(
    UPDATE_CUSTOM_ANGLE_INPUT
  );
  const CUSTOM_ANGLE_LIST = [
    -90, -75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75, 90,
  ];

  function handleSelectItem(value: number) {
    changeTextRotationInput(value);
    closeDropdown();
  }

  let element: HTMLElement = null;
  const keyControlList: KeyControlConfig[] = [];
  const keyControlOptions: KeyControlActionOptions = {
    configList: keyControlList,
  };

  $: activeValue = $textRotationValue;
</script>

<div
  bind:this={element}
  class="dropdown"
  use:keyControlAction={keyControlOptions}
>
  <div class="flex flex-col w-[174px] text-13px font-medium">
    {#each CUSTOM_ANGLE_LIST as value, i}
      <CustomAngleElement
        index={i}
        {keyControlList}
        {updateInputValue}
        {handleSelectItem}
        activeValue={activeValue.value}
        {value}
        scrollContainer={element}
      />
    {/each}
  </div>
</div>

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded py-1.5 h-[inherit] overflow-y-auto overflow-x-hidden;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }
</style>
