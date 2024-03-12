<script lang="ts">
  import { onMount, tick } from "svelte";
  import {
    hsvaToHex,
    hexToRgba,
    MAX_SATURATION_COLOR,
    MAX_VALUE_COLOR,
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

  export let saturationColor: number;
  export let valueColor: number;
  export let hueColor: number;
  export let opacityColor: number;
  export let sourceOfChange: SourceOfChange;
  export let pickerSize = 12;
  export let changePaletteColor: (s: number, v: number) => void;
  export let index: number;
  export let keyControlActionOptions: KeyControlActionOptions;
  export let scrollContainer: HTMLElement = null;

  let pickerElement: HTMLElement;
  let colorPaletteElement: HTMLElement;
  let isMounted = false;
  let pickerLeft: number;
  let pickerTop: number;
  let pickerBackground: string;
  let paletteBackground: string;
  let isSelected = false;

  onMount(() => {
    isMounted = true;
    updateColorPalette();
    pickerElement.addEventListener("keydown", handleArrowKey);
    document.addEventListener("mousedown", handleWindowMouseDown, true);
    return () => {
      pickerElement.removeEventListener("keydown", handleArrowKey);
      document.removeEventListener("mousedown", handleWindowMouseDown, true);
    };
  });

  function valueToPickerTop(value: number): number {
    const colorPaletteBound = colorPaletteElement.getBoundingClientRect();
    return (
      colorPaletteBound.height -
      (colorPaletteBound.height * value) / MAX_VALUE_COLOR -
      pickerSize / 2
    );
  }

  function saturationToPickerLeft(saturation: number): number {
    const colorPaletteBound = colorPaletteElement.getBoundingClientRect();
    return (
      (colorPaletteBound.width * saturation) / MAX_VALUE_COLOR - pickerSize / 2
    );
  }

  function updatePickerFromValue(
    saturation: number,
    value: number,
    isFromDrag = false
  ) {
    pickerLeft = saturationToPickerLeft(saturation);
    pickerTop = valueToPickerTop(value);
    pickerBackground = hsvaToHex(hueColor, saturation, value, opacityColor);

    if (isFromDrag) {
      changePaletteColor(saturation, value);
    }
  }

  function updatePickerFromPosition(x: number, y: number) {
    const colorPaletteBound = colorPaletteElement.getBoundingClientRect();
    const { top, bottom, left, right } = colorPaletteBound;
    x = normalizeValueInRange(x, left, right);
    y = normalizeValueInRange(y, top, bottom);
    const saturation = ((x - left) * MAX_SATURATION_COLOR) / (right - left);
    const value = ((bottom - y) * MAX_VALUE_COLOR) / (bottom - top);
    updatePickerFromValue(saturation, value, true);
  }

  function handlePaletteMousedown(event: MouseEvent) {
    updatePickerFromPosition(event.clientX, event.clientY);
    startDraggingPicker();

    isSelected = true;
    keyControlActionOptions.selectFromOutside(index);
    setTimeout(() => pickerElement.focus());
  }

  function startDraggingPicker() {
    document.addEventListener("mousemove", handleDragging);
    document.addEventListener("mouseup", stopDraggingPicker);
  }

  function stopDraggingPicker() {
    document.removeEventListener("mousemove", handleDragging);
    document.removeEventListener("mouseup", stopDraggingPicker);
    setTimeout(() => pickerElement.focus());
  }

  function handleDragging(event: MouseEvent) {
    updatePickerFromPosition(event.clientX, event.clientY);
  }

  function handlePickerPositionChange(deltaX: number, deltaY: number) {
    const pickerBound = pickerElement.getBoundingClientRect();
    const newX = pickerBound.left + pickerBound.width / 2 + deltaX;
    const newY = pickerBound.top + pickerBound.height / 2 + deltaY;

    updatePickerFromPosition(newX, newY);
  }

  function handleArrowKey(event: KeyboardEvent) {
    if (!isSelected) return;

    switch (event.key) {
      case "ArrowUp": {
        handlePickerPositionChange(0, -2);
        break;
      }
      case "ArrowDown": {
        handlePickerPositionChange(0, 2);
        break;
      }
      case "ArrowLeft": {
        handlePickerPositionChange(-2, 0);
        break;
      }
      case "ArrowRight": {
        handlePickerPositionChange(2, 0);
        break;
      }
      default:
        break;
    }
  }

  function handleWindowMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (colorPaletteElement.contains(target)) {
      return;
    }

    isSelected = false;
    if (document.activeElement === pickerElement) pickerElement.blur();
    keyControlActionOptions.deselectFromOutside(index);
  }

  function updateColorPalette() {
    if (isMounted) {
      const rgba = hexToRgba(
        hsvaToHex(hueColor, MAX_SATURATION_COLOR, MAX_VALUE_COLOR, opacityColor)
      );
      paletteBackground = `linear-gradient(to top, rgba(0, 0, 0, ${opacityColor}), transparent), linear-gradient(to left, rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${opacityColor}), rgba(255, 255, 255, ${opacityColor}))`;
      updatePickerFromValue(saturationColor, valueColor);
    }
  }

  $: if (
    (hasValue(hueColor) ||
      hasValue(saturationColor) ||
      hasValue(valueColor) ||
      hasValue(opacityColor)) &&
    sourceOfChange !== "COLOR_PALETTE"
  ) {
    updateColorPalette();
  }

  async function onSelectCallback(byKey = false) {
    isSelected = true;
    if (byKey) {
      await tick();
      scrollVerticalToVisible(scrollContainer, pickerElement);
    }
    setTimeout(() => pickerElement.focus());
  }

  function onDeselectCallback() {
    if (document.activeElement === pickerElement) pickerElement.blur();
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
  class="color-palette"
  bind:this={colorPaletteElement}
  on:mousedown={handlePaletteMousedown}
  style="background: {paletteBackground};"
>
  <button
    bind:this={pickerElement}
    class="picker"
    class:selected={isSelected}
    style="width: {pickerSize}px;height: {pickerSize}px;left: {pickerLeft}px;top: {pickerTop}px;"
    use:registerElement={options}
    tabindex={-1}
  >
    <div
      class="picker-background"
      style="background-color: {pickerBackground};"
    />
  </button>
</div>

<style lang="postcss">
  .color-palette {
    @apply relative w-full h-full rounded;
  }

  .picker {
    @apply absolute box-border rounded-full border-none outline-none cursor-pointer;
    /** prevent color with opacity stack on each other*/
    background-color: white;
  }

  .picker-background {
    @apply w-full h-full rounded-full box-border;
    border: 1.5px solid white;
    box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.2);
  }

  button.selected:focus .picker-background {
    border-color: rgb(0, 195, 255);
  }
</style>
