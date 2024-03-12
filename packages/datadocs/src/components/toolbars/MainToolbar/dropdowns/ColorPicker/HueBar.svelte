<script lang="ts">
  import { onMount, tick } from "svelte";
  import {
    MAX_HUE_COLOR,
    MIN_HUE_COLOR,
    MAX_OPACITY_COLOR,
    MAX_SATURATION_COLOR,
    MAX_VALUE_COLOR,
    hsvaToHex,
    normalizeValueInRange,
    hasValue,
  } from "../utils/colorUtils";
  import { registerElement } from "../../../../common/key-control/listKeyControl";
  import type {
    RegisterElementOptions,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";
  import type { SourceOfChange } from "./type";

  export let huePickerSize = 10;
  export let hueColor: number;
  export let sourceOfChange: SourceOfChange;
  export let changeHueColor: (v: number) => void;
  export let index: number;
  export let keyControlActionOptions: KeyControlActionOptions;
  export let scrollContainer: HTMLElement = null;

  let huePickerElement: HTMLElement;
  let hueSliderElement: HTMLElement;
  let huePickerLeft: number;
  let huePickerTop: number;
  let huePickerBackground: string;
  let isMounted = false;
  let isSelected = false;

  onMount(() => {
    isMounted = true;
    init();
    huePickerElement.addEventListener("keydown", handleArrowKey);
    document.addEventListener("mousedown", handleWindowMouseDown, true);
    return () => {
      huePickerElement.removeEventListener("keydown", handleArrowKey);
      document.removeEventListener("mousedown", handleWindowMouseDown, true);
    };
  });

  function init() {
    const hueSliderBound = hueSliderElement.getBoundingClientRect();

    huePickerLeft = Math.round(hueSliderBound.width / 2 - huePickerSize / 2);
    updateHueBarFromValue(hueColor);
  }

  function hueToPickerTop(value: number): number {
    value = normalizeValueInRange(value, MIN_HUE_COLOR, MAX_HUE_COLOR);
    const hueSliderBound = hueSliderElement.getBoundingClientRect();
    const height = hueSliderBound.height;
    const yCenter = height - (height * value) / MAX_HUE_COLOR;

    return yCenter - huePickerSize / 2;
  }

  function mousePositionToHue(y: number): number {
    const hueSliderBound = hueSliderElement.getBoundingClientRect();
    const top = hueSliderBound.top;
    const bottom = hueSliderBound.bottom;
    y = normalizeValueInRange(y, top, bottom);

    return ((bottom - y) * MAX_HUE_COLOR) / (bottom - top);
  }

  function handleHueSliderMouseDown(event: MouseEvent) {
    updateHueBarFromPosition(event.clientY);
    startDraggingPicker();

    isSelected = true;
    keyControlActionOptions.selectFromOutside(index);
    setTimeout(() => huePickerElement.focus());
  }

  function startDraggingPicker() {
    document.addEventListener("mousemove", handleDragging);
    document.addEventListener("mouseup", stopDraggingPicker);
  }

  function stopDraggingPicker() {
    document.removeEventListener("mousemove", handleDragging);
    document.removeEventListener("mouseup", stopDraggingPicker);
    setTimeout(() => huePickerElement.focus());
  }

  function handleDragging(event: MouseEvent) {
    updateHueBarFromPosition(event.clientY);
  }

  function updateHueBarFromPosition(y: number) {
    const v = mousePositionToHue(y);
    updateHueBarFromValue(v, true);
  }

  function updateHueBarFromValue(v: number, isFromDrag = false) {
    huePickerBackground = hsvaToHex(
      v,
      MAX_SATURATION_COLOR,
      MAX_VALUE_COLOR,
      MAX_OPACITY_COLOR
    );
    huePickerTop = Math.round(hueToPickerTop(v));

    if (isFromDrag) {
      changeHueColor(v);
    }
  }

  function handlePickerPositionChange(deltaY: number) {
    const pickerBound = huePickerElement.getBoundingClientRect();
    const newY = pickerBound.top + pickerBound.height / 2 + deltaY;
    updateHueBarFromPosition(newY);
  }

  function handleArrowKey(event: KeyboardEvent) {
    if (!isSelected) return;

    switch (event.key) {
      case "ArrowUp": {
        handlePickerPositionChange(-2);
        break;
      }
      case "ArrowDown": {
        handlePickerPositionChange(2);
        break;
      }
      default:
        break;
    }
  }

  function handleWindowMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (hueSliderElement.contains(target)) {
      return;
    }
    isSelected = false;
    if (document.activeElement === huePickerElement) huePickerElement.blur();
    keyControlActionOptions.deselectFromOutside(index);
  }

  $: if (hasValue(hueColor) && sourceOfChange !== "HUE_BAR" && isMounted) {
    updateHueBarFromValue(hueColor);
  }

  $: if (huePickerLeft !== undefined && huePickerTop !== undefined) {
    if (isMounted) {
      Object.assign(huePickerElement.style, {
        left: huePickerLeft + "px",
        top: huePickerTop + "px",
      });
    }
  }

  async function onSelectCallback(byKey = false) {
    isSelected = true;
    if (byKey) {
      await tick();
      scrollVerticalToVisible(scrollContainer, huePickerElement);
    }
    setTimeout(() => huePickerElement.focus());
  }

  function onDeselectCallback() {
    if (document.activeElement === huePickerElement) huePickerElement.blur();
    isSelected = false;
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
  class="hue-slider"
  bind:this={hueSliderElement}
  on:mousedown={handleHueSliderMouseDown}
  use:registerElement={options}
>
  <button
    class="hue-picker"
    class:selected={isSelected}
    style="width:{huePickerSize}px;height:{huePickerSize}px;background-color:{huePickerBackground};"
    bind:this={huePickerElement}
    tabindex={-1}
  />
</div>

<style lang="postcss">
  .hue-slider {
    @apply relative rounded-sm w-1.5 h-full;
    background: linear-gradient(0deg, red, #ff0, #0f0, #0ff, #00f, #f0f, red);
  }

  .hue-picker {
    @apply absolute box-border rounded-full outline-none cursor-pointer;
    border: 1.5px solid white;
    box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.2);
  }

  .hue-picker.selected:focus {
    border-color: rgb(0, 195, 255);
  }
</style>
