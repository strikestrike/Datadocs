<script lang="ts">
  import { normalizeValueInRange, hasValue } from "../utils/colorUtils";
  import ControlButton from "./ControlButton.svelte";
  import { registerElement } from "../../../../common/key-control/listKeyControl";
  import type {
    RegisterElementOptions,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";
  import type { SourceOfChange } from "./type";
  import { tick } from "svelte";

  export let opacityColor: number;
  export let sourceOfChange: SourceOfChange;
  export let changeOpacityColor: (v: number) => void;
  export let index: number;
  export let keyControlActionOptions: KeyControlActionOptions;
  export let scrollContainer: HTMLElement = null;
  export let handleSelect: Function;

  const MIN_OPACITY_PERCENT = 0;
  const MAX_OPACITY_PERCENT = 100;

  let value: number;
  let inputElement: HTMLInputElement;
  let isLocked = true;
  let options: RegisterElementOptions;
  let isSelected = false;
  const inputIndex = index + 1;

  function handleInputChange() {
    if (!isNaN(value)) {
      const v = Math.round(
        normalizeValueInRange(value, MIN_OPACITY_PERCENT, MAX_OPACITY_PERCENT)
      );
      changeOpacityColor(v / MAX_OPACITY_PERCENT);
    }
  }

  function handleInputKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && isSelected) {
      handleSelect();
    }
  }

  function toggleLockOpacity() {
    isLocked = !isLocked;

    if (isLocked) {
      inputElement.blur();
    }
  }

  $: if (hasValue(opacityColor) && sourceOfChange !== "OPACITY_INPUT") {
    value = Math.round(
      normalizeValueInRange(
        opacityColor * MAX_OPACITY_PERCENT,
        MIN_OPACITY_PERCENT,
        MAX_OPACITY_PERCENT
      )
    );
  }

  async function onSelectCallback(byKey = false) {
    if (byKey) {
      inputElement.focus();
      await tick();
      scrollVerticalToVisible(scrollContainer, inputElement);
    }
  }

  function onDeselectCallback() {
    inputElement.blur();
  }

  function handleInputFocus() {
    isSelected = true;
    keyControlActionOptions.selectFromOutside(inputIndex);
    inputElement.select();
  }

  function handleInputBlur() {
    isSelected = false;
    keyControlActionOptions.deselectFromOutside(inputIndex);
  }

  $: options = {
    config: {
      isSelected: false,
      index,
      onSelectCallback,
      onDeselectCallback,
    },
    configList: keyControlActionOptions.configList,
    index: inputIndex,
    selectOnHover: false,
    disabled: isLocked,
  };
</script>

<div
  class="relative w-full h-full text-10px font-medium"
  use:registerElement={options}
>
  <input
    bind:this={inputElement}
    class="pl-6 pr-4 py-1.5 outline-none"
    class:input-lock={isLocked}
    type="text"
    bind:value
    on:input={handleInputChange}
    on:keydown={handleInputKeyDown}
    on:focus={handleInputFocus}
    on:blur={handleInputBlur}
  />

  <div class="absolute top-0 bottom-0 left-0 w-19px py-1.5 pl-1">
    <div class="cursor-pointer">
      <ControlButton
        handleSelect={toggleLockOpacity}
        icon={isLocked ? "toolbar-opacity-lock" : "toolbar-opacity-unlock"}
        type="svgButton"
        {index}
        {keyControlActionOptions}
      />
    </div>
  </div>

  <div
    class="absolute top-0 bottom-0 right-0 py-1.5 pr-1.5 flex flex-row items-center text-[#A7B0B5] font-bold pointer-events-none"
  >
    %
  </div>
</div>

<style lang="postcss">
  input {
    @apply w-full h-full rounded font-bold;
    border: 1px solid #e9edf0;
    box-sizing: border-box;
  }

  .input-lock {
    @apply pointer-events-none;
  }
</style>
