<script lang="ts">
  import { isHexColor, normalizeHexColor, hasValue } from "../utils/colorUtils";
  import { registerElement } from "../../../../common/key-control/listKeyControl";
  import type {
    RegisterElementOptions,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";
  import type { SourceOfChange } from "./type";
  import { tick } from "svelte";

  export let hexColor: string;
  export let sourceOfChange: SourceOfChange;
  export let changeHexColor: (v: string) => void;
  export let index: number;
  export let keyControlActionOptions: KeyControlActionOptions;
  export let scrollContainer: HTMLElement = null;
  export let handleSelect: Function;

  let inputElement: HTMLInputElement;
  let value: string;
  let isSelected = false;

  function handleInputChange() {
    if (isHexColor(value)) {
      changeHexColor(value);
    }
  }

  function handleInputKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && isSelected) {
      handleSelect();
    }
  }

  function handleHexColorChange() {
    if (inputElement && inputElement.value === hexColor) {
      return;
    }

    value = normalizeHexColor(hexColor);
    if (!value) return;

    if (value.substring(7).toUpperCase() === "FF") {
      value = value.substring(1, 7);
    } else {
      value = value.substring(1);
    }
  }

  $: if (hasValue(hexColor) && sourceOfChange !== "HEX_INPUT") {
    handleHexColorChange();
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
    keyControlActionOptions.selectFromOutside(index);
    inputElement.select();
  }

  function handleInputBlur() {
    isSelected = false;
    keyControlActionOptions.deselectFromOutside(index);
  }

  const options: RegisterElementOptions = {
    config: {
      isSelected: false,
      index,
      onSelectCallback,
      onDeselectCallback,
    },
    configList: keyControlActionOptions.configList,
    index,
    selectOnHover: false,
  };
</script>

<div
  class="relative w-full h-full text-10px font-medium"
  use:registerElement={options}
>
  <input
    bind:this={inputElement}
    class="pl-[18px] pr-1.5 py-1.5 outline-none"
    spellcheck={false}
    type="text"
    bind:value
    on:input={handleInputChange}
    on:keydown={handleInputKeyDown}
    on:focus={handleInputFocus}
    on:blur={handleInputBlur}
  />

  <div
    class="absolute top-0 bottom-0 left-0 py-1.5 pl-1.5 flex flex-row items-center text-[#A7B0B5] font-bold pointer-events-none"
  >
    #
  </div>
</div>

<style lang="postcss">
  input {
    @apply relative w-full h-full rounded font-bold;
    border: 1px solid #e9edf0;
    box-sizing: border-box;
  }
</style>
