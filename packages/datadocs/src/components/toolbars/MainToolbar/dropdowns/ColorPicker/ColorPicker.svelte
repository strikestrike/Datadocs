<script lang="ts">
  import ColorPalette from "./ColorPalette.svelte";
  import HueBar from "./HueBar.svelte";
  import HexInput from "./HexInput.svelte";
  import OpacityInput from "./OpacityInput.svelte";
  import { RETURN_TO_MAIN_MENU } from "../default";
  import {
    hexToHsva,
    hsvaToHex,
    normalizeHexColor,
    normalizeValueInRange,
    MIN_HUE_COLOR,
    MAX_HUE_COLOR,
    MIN_OPACITY_COLOR,
    MAX_OPACITY_COLOR,
    MIN_SATURATION_COLOR,
    MAX_SATURATION_COLOR,
    MIN_VALUE_COLOR,
    MAX_VALUE_COLOR,
  } from "../utils/colorUtils";
  import { addCustomColor } from "../../../../../app/store/store-toolbar";
  import { getContext } from "svelte";
  import {
    keyControlAction,
    CONTROL_BY_TAB_KEY,
  } from "../../../../common/key-control/listKeyControl";
  import type {
    KeyControlConfig,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import ControlButton from "./ControlButton.svelte";
  import type { SourceOfChange } from "./type";

  export let hexColor = "#FF0000";
  export let cancelPickColor: () => void;
  export let submitPickColor: (color: string) => void;
  export let scrollContainer: HTMLElement = null;

  const returnToMainMenu: () => void = getContext(RETURN_TO_MAIN_MENU);
  const hsva = hexToHsva(hexColor);
  let hueColor: number = hsva ? hsva[0] : MIN_HUE_COLOR;
  let saturationColor: number = hsva ? hsva[1] : MIN_SATURATION_COLOR;
  let valueColor: number = hsva ? hsva[2] : MIN_VALUE_COLOR;
  let opacityColor: number = hsva ? hsva[3] : MIN_OPACITY_COLOR;
  let sourceOfChange: SourceOfChange = "";

  const configList: KeyControlConfig[] = [];
  const options: KeyControlActionOptions = {
    configList: configList,
    keyControlType: CONTROL_BY_TAB_KEY,
  };

  const backButtonSvg = `
    <svg width="6" height="8" viewBox="0 0 6 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 1L2 4L5 7" stroke="#A7B0B5" stroke-width="1.5"/>
    </svg>
  `;

  function changeHueColor(v: number) {
    v = normalizeValueInRange(v, MIN_HUE_COLOR, MAX_HUE_COLOR);
    sourceOfChange = "HUE_BAR";
    hueColor = v;
    saturationColor = saturationColor;
    valueColor = valueColor;
    hexColor = hsvaToHex(hueColor, saturationColor, valueColor, opacityColor);
  }

  function changeOpacityColor(v: number) {
    v = normalizeValueInRange(v, MIN_OPACITY_COLOR, MAX_OPACITY_COLOR);
    sourceOfChange = "OPACITY_INPUT";
    opacityColor = v;
    hexColor = hsvaToHex(hueColor, saturationColor, valueColor, opacityColor);
  }

  function changeHexColor(color: string) {
    sourceOfChange = "HEX_INPUT";
    [hueColor, saturationColor, valueColor, opacityColor] = hexToHsva(
      normalizeHexColor(color)
    );
    hexColor = color;
  }

  function changePaletteColor(saturation: number, value: number) {
    sourceOfChange = "COLOR_PALETTE";
    saturation = normalizeValueInRange(
      saturation,
      MIN_SATURATION_COLOR,
      MAX_SATURATION_COLOR
    );
    value = normalizeValueInRange(value, MIN_VALUE_COLOR, MAX_VALUE_COLOR);
    saturationColor = saturation;
    valueColor = value;
    hexColor = hsvaToHex(hueColor, saturationColor, valueColor, opacityColor);
  }

  function handleOkClick() {
    const color = hsvaToHex(hueColor, saturationColor, valueColor, opacityColor);
    addCustomColor(color);
    submitPickColor(color);
  }
</script>

<div class="px-2 pt-3 pb-2" use:keyControlAction={options}>
  <div class="relative">
    <div class="back-button cursor-poiter">
      <ControlButton
        handleSelect={returnToMainMenu}
        content={backButtonSvg}
        type="svgButton"
        index={0}
        keyControlActionOptions={options}
        {scrollContainer}
      />
    </div>

    <div
      class="w-full px-3 text-center text-10px text-[#A7B0B5] font-normal uppercase"
    >
      Add custom color
    </div>
  </div>

  <div class="mt-2 flex flex-row space-x-2.5">
    <div class="w-[185px] h-[185px]">
      <ColorPalette
        {saturationColor}
        {valueColor}
        {hueColor}
        {opacityColor}
        {sourceOfChange}
        {changePaletteColor}
        index={1}
        keyControlActionOptions={options}
        {scrollContainer}
      />
    </div>

    <div class="w-1.5 h-[185px] mr-0.5">
      <HueBar
        {hueColor}
        {changeHueColor}
        index={2}
        keyControlActionOptions={options}
        {scrollContainer}
        {sourceOfChange}
      />
    </div>
  </div>

  <div class="mt-3 flex flex-row space-x-2">
    <div class="w-[115px] h-[27px]">
      <HexInput
        {hexColor}
        {sourceOfChange}
        {changeHexColor}
        index={3}
        keyControlActionOptions={options}
        {scrollContainer}
        handleSelect={handleOkClick}
      />
    </div>

    <div class="w-[80px] h-[27px]">
      <OpacityInput
        {opacityColor}
        {sourceOfChange}
        {changeOpacityColor}
        index={4}
        keyControlActionOptions={options}
        {scrollContainer}
        handleSelect={handleOkClick}
      />
    </div>
  </div>

  <div
    class="mt-2 flex flex-row justify-end space-x-1.5 text-11px font-medium"
  >
    <ControlButton
      handleSelect={cancelPickColor}
      content="Cancel"
      type="secondary"
      index={8}
      keyControlActionOptions={options}
      {scrollContainer}
    />

    <ControlButton
      handleSelect={handleOkClick}
      content="Ok"
      type="primary"
      index={9}
      keyControlActionOptions={options}
      {scrollContainer}
    />
  </div>
</div>

<style lang="postcss">
  .back-button {
    @apply absolute w-2.5 h-3 left-0 top-0.5 cursor-pointer;
    @apply flex flex-row items-center;
  }
</style>
