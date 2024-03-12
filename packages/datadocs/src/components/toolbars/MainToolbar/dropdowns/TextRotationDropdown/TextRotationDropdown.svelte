<script lang="ts">
  import { getContext, setContext } from "svelte";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import { UPDATE_CUSTOM_ANGLE_INPUT } from "./constant";
  import { keyControlAction } from "../../../../common/key-control/listKeyControl";
  import type {
    KeyControlConfig,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import { textRotationValue } from "../../../../../app/store/writables";
  import TextRotationItem from "./TextRotationItem.svelte";
  import {
    changeTextRotationValue,
    setTextRotationStackVertically,
  } from "../../../../../app/store/store-toolbar";
  import ToolbarInputButton from "../../buttons/ToolbarInputButton.svelte";
  import FontSizeDropdown from "../FontSizeDropdown/FontSizeDropdown.svelte";
  import CustomAngleDropdown from "./CustomAngle/CustomAngleDropdown.svelte";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  setContext(UPDATE_CUSTOM_ANGLE_INPUT, handleInputChange);

  let isProcessing = false;
  let inputValue = { value: 0 };

  const TEXT_ROTATION_ITEMS = [
    { value: 0, label: "None", icon: "text-rotation-none" },
    // { value: 15, label: "15", icon: "text-rotation-tilt-up" },
    // { value: -15, label: "-15", icon: "text-rotation-tilt-down" },
    // { value: 30, label: "30", icon: "text-rotation-tilt-up" },
    // { value: -30, label: "-30", icon: "text-rotation-tilt-down" },
    { value: 45, label: "Tilt up", icon: "text-rotation-tilt-up" },
    { value: -45, label: "Tilt down", icon: "text-rotation-tilt-down" },
    // { value: 60, label: "60", icon: "text-rotation-tilt-up" },
    // { value: -60, label: "-60", icon: "text-rotation-tilt-down" },
    // { value: 75, label: "75", icon: "text-rotation-tilt-up" },
    // { value: -75, label: "-75", icon: "text-rotation-tilt-down" },
    {
      value: 180,
      label: "Stack vertically",
      icon: "text-rotation-stack-vertically",
    },
    { value: 90, label: "Rotate up", icon: "text-rotation-rotate-up" },
    { value: -90, label: "Rotate down", icon: "text-rotation-rotate-down" },
  ];

  async function handleSelectItem(value: number) {
    if (isProcessing) return;

    isProcessing = true;
    if (value === 180) {
      await setTextRotationStackVertically();
    } else {
      await changeTextRotationValue(value);
    }
    isProcessing = false;
    closeDropdown();
  }

  async function handleInputChange(value: number | string) {
    if (isProcessing) return;

    isProcessing = true;
    await changeTextRotationValue(value);
    isProcessing = false;
  }

  let element: HTMLElement = null;
  const keyControlList: KeyControlConfig[] = [];
  const keyControlOptions: KeyControlActionOptions = {
    configList: keyControlList,
    controlOrientation: "horizontal",
  };

  $: activeValue = $textRotationValue;
  $: if (activeValue) {
    const value = activeValue.value === 180 ? 0 : activeValue.value;
    inputValue = { value };
  }
</script>

<div
  bind:this={element}
  class="dropdown"
  class:disabled={isProcessing}
  use:keyControlAction={keyControlOptions}
>
  <div class="flex flex-row space-x-0.5">
    {#each TEXT_ROTATION_ITEMS as item, index}
      {@const active = activeValue.value === item.value}
      <TextRotationItem
        value={item.value}
        icon={item.icon}
        label={item.label}
        {active}
        {index}
        {handleSelectItem}
        {keyControlList}
      />
    {/each}
  </div>

  <div class="text-rotation-input">
    <ToolbarInputButton
      isDropdownChild={true}
      value="{inputValue.value}°"
      changeValue={handleInputChange}
      inputWidth={140}
      tooltip="Custom angle"
      dropdownComponent={CustomAngleDropdown}
    />
  </div>
</div>

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded p-2.5 h-[inherit];
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .disabled :global(*) {
    @apply pointer-event-none;
  }

  .text-rotation-input {
    @apply w-full mt-2 flex flex-row items-center justify-center;
  }

  .text-rotation-input :global(.toolbar-input) {
    @apply rounded-[6px] px-2;
    @apply border border-solid border-light-100;
  }

  .text-rotation-input :global(.toolbar-input.active) {
    @apply !bg-light-100 text-dark-300;
  }

  .text-rotation-input :global(.toolbar-input:not(.active) svg) {
    @apply text-dark-50;
  }
</style>
