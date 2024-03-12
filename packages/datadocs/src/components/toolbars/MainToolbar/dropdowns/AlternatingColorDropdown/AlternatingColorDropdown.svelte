<script lang="ts">
  import { getContext, onDestroy, setContext, tick } from "svelte";
  import AlternatingColorElement from "./AlternatingColorElement.svelte";
  import CustomStyleSection from "./CustomStyleSection.svelte";
  import Title from "../common/DropdownSectionTitle.svelte";
  import Button from "../../../../common/form/Button.svelte";
  import ControlButton from "./ControlButton.svelte";
  import AddCustomAlternatingColors from "./AddCustomAlternatingColors.svelte";
  import {
    CLOSE_DROPDOWN_CONTEXT_NAME,
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME,
  } from "../../../../common/dropdown";
  import {
    defaultAlternatingColorsStore,
    customAlternatingColorsStore,
    activeAlternatingColors,
    addCustomAlternatingColors,
    getAlternatingColorByName,
    getFirstAlternatingColor,
    setActiveAlternatingColors,
  } from "./default";
  import {
    CHILD_DROPDOWN_STATE_CHANGE,
    CHILD_DROPDOWN_CLASS_NAME,
  } from "../default";
  import { gridKeyControlAction } from "../../../../common/key-control/gridKeyControl";
  import type {
    GridKeyControlConfig,
    GridKeyControlActionOptions,
  } from "../../../../common/key-control/gridKeyControl";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );
  const alternatingColorsPerRow = 4;
  let isKeyControlDisabled = false;
  let dropdownElement: HTMLElement;
  let isDisableScroll = false;
  const wheelEvent =
    "onwheel" in document.createElement("div") ? "wheel" : "mousewheel";
  const disabledMenuEvents = [
    wheelEvent,
    "touchmove",
    "mouseenter",
    "mouseleave",
    "mouseover",
  ];

  function handleSelectAlternatingColor(value: string) {
    setActiveAlternatingColors(value);
    closeDropdown();
  }

  function handleResetButtonClick() {
    closeDropdown();
  }

  function onDisableMenuEvent(event: MouseEvent) {
    const childDropdown = dropdownElement.querySelector(
      `.${CHILD_DROPDOWN_CLASS_NAME}`
    );
    const target = event.target as HTMLElement;
    if (target && childDropdown.contains(target)) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function disableMenu() {
    isKeyControlDisabled = true;
    if (isDisableScroll) return;
    isDisableScroll = true;
    disabledMenuEvents.forEach((eventName) => {
      dropdownElement.addEventListener(eventName, onDisableMenuEvent, true);
    });
  }

  function enableMenu() {
    isKeyControlDisabled = false;
    if (!isDisableScroll) return;
    isDisableScroll = false;
    disabledMenuEvents.forEach((eventName) => {
      dropdownElement.removeEventListener(eventName, onDisableMenuEvent, true);
    });
  }

  function handleChildDropdownChange() {
    if (!dropdownElement) return;
    const hasChildDropdown = dropdownElement.querySelector(
      `.${CHILD_DROPDOWN_CLASS_NAME}`
    );
    if (hasChildDropdown) disableMenu();
    else enableMenu();
  }

  async function handleAddNewCustomColor() {
    const data =
      getAlternatingColorByName(activeColorsName) || getFirstAlternatingColor();
    addCustomAlternatingColors(data);
    await tick();
    updateDropdownStyle();
  }

  onDestroy(() => {
    disabledMenuEvents.forEach((eventName) => {
      dropdownElement.removeEventListener(eventName, onDisableMenuEvent, true);
    });
  });

  const configList: GridKeyControlConfig[][] = [];
  const options: GridKeyControlActionOptions = {
    configList: configList,
    disabled: isKeyControlDisabled,
  };

  $: isKeyControlDisabled, (options.disabled = isKeyControlDisabled);
  $: defaultAlternatingColors = $defaultAlternatingColorsStore;
  $: customAlternatingColors = $customAlternatingColorsStore;
  $: activeColorsName = $activeAlternatingColors.value;
  $: customStartRowIndex = Math.ceil(
    defaultAlternatingColors.length / alternatingColorsPerRow
  );
  $: customStyleSectionRowIndex =
    customStartRowIndex +
    Math.ceil(customAlternatingColors.length / alternatingColorsPerRow) +
    2;
  setContext(CHILD_DROPDOWN_STATE_CHANGE, handleChildDropdownChange);
</script>

<div
  class="dropdown"
  use:gridKeyControlAction={options}
  bind:this={dropdownElement}
>
  <div class="px-4">
    <Title title="default styles" />
    <div class="alternating-color-list">
      {#each defaultAlternatingColors as color, index (color.name)}
        {@const cidx = index % alternatingColorsPerRow}
        {@const ridx = Math.floor(index / alternatingColorsPerRow)}
        <AlternatingColorElement
          data={color}
          {handleSelectAlternatingColor}
          {ridx}
          {cidx}
          gridKeyControlOptions={options}
          scrollContainer={dropdownElement}
        />
      {/each}
    </div>
  </div>

  <div class="w-full h-px my-3 border-b border-solid border-light-100" />

  <div class="px-4">
    <Title title="custom styles" />
    <div class="alternating-color-list">
      <AddCustomAlternatingColors
        ridx={customStartRowIndex}
        cidx={0}
        gridKeyControlOptions={options}
        {handleAddNewCustomColor}
        scrollContainer={dropdownElement}
      />
      {#each customAlternatingColors as color, index (color.name)}
        {@const cidx = (index + 1) % alternatingColorsPerRow}
        {@const ridx =
          customStartRowIndex +
          Math.floor((index + 1) / alternatingColorsPerRow)}
        <AlternatingColorElement
          data={color}
          {handleSelectAlternatingColor}
          {ridx}
          {cidx}
          gridKeyControlOptions={options}
          scrollContainer={dropdownElement}
        />
      {/each}
    </div>
    <div class="pt-4">
      {#key activeColorsName}
        <CustomStyleSection
          gridKeyControlOptions={options}
          scrollContainer={dropdownElement}
          startRowIndex={customStyleSectionRowIndex}
        />
      {/key}
    </div>
  </div>

  {#key customStyleSectionRowIndex}
    <div class="mx-4 mt-4 h-[30px]">
      <ControlButton
        ridx={customStyleSectionRowIndex + 5}
        cidx={0}
        gridKeyControlOptions={options}
        scrollContainer={dropdownElement}
        let:selected
      >
        <Button
          on:click={handleResetButtonClick}
          color="secondary"
          class="w-full h-full text-11px{selected ? ' selected' : ''}"
        >
          Reset
        </Button>
      </ControlButton>
    </div>
  {/key}
</div>

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded text-13px py-3 h-[inherit] overflow-x-hidden overflow-y-auto;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .alternating-color-list {
    @apply grid gap-3;
    grid-template-columns: repeat(4, 60px);
  }
</style>
