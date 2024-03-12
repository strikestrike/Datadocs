<script lang="ts">
  import { getContext, onDestroy, setContext, tick } from "svelte";
  import CellColor from "./CellColor.svelte";
  import TextBackground from "./TextBackground.svelte";
  import {
    getBackgroundColorValue,
    changeBackgroundColorValue,
    getColorFromValue,
    previewBackgroundColor,
  } from "../../../../../app/store/store-toolbar";
  import {
    OPEN_COLOR_PICKER_MENU,
    RETURN_TO_MAIN_MENU,
    HOVER_ON_COLOR_CONTEXT_NAME,
  } from "../default";
  import {
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME,
    CLOSE_DROPDOWN_CONTEXT_NAME,
  } from "../../../../common/dropdown";
  import ColorPicker from "../ColorPicker/ColorPicker.svelte";
  import Tab from "./Tab.svelte";
  import { gridKeyControlAction } from "../../../../common/key-control/gridKeyControl";
  import type {
    GridKeyControlConfig,
    GridKeyControlActionOptions,
  } from "../../../../common/key-control/gridKeyControl";

  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );
  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  const backgroundValue = getBackgroundColorValue();
  let tabs = [
    {
      id: "cell_color",
      label: "Cell Color",
      isActive: backgroundValue.type === "cellcolor",
      component: CellColor,
    },
    {
      id: "text_bg",
      label: "Text Bg",
      isActive: backgroundValue.type === "textbg",
      component: TextBackground,
    },
  ];
  let activeTab = getActiveTab();
  let showColorPickerMenu = false;
  const hexColor = getColorFromValue(backgroundValue.value) || "FFFFFF";
  let element: HTMLElement;
  let isProcessing = false;

  function handleSwitchTab(tabId: string) {
    if (activeTab.id && activeTab.id === tabId) {
      return;
    }

    const tab = tabs.find((t) => t.id === tabId);

    if (tab) {
      tabs.forEach((t) => {
        t.isActive = t.id === tab.id;
      });
    }

    tabs = tabs;
    activeTab = getActiveTab();
  }

  function getActiveTab() {
    return tabs.find((tab) => tab.isActive === true);
  }

  function hoverOnColor(value: string) {
    const tab = getActiveTab();
    if (tab.id === "cell_color") {
      previewBackgroundColor(value);
    }
  }

  async function openColorPickerMenu() {
    showColorPickerMenu = true;
    await tick();
    updateDropdownStyle();
  }

  async function returnToMainMenu() {
    showColorPickerMenu = false;
    await tick();
    updateDropdownStyle();
  }

  function cancelPickColor() {
    closeDropdown();
  }

  async function submitPickColor(color: string) {
    const type = getActiveTab().id === "cell_color" ? "cellcolor" : "textbg";
    await changeColor({ value: color, type: type });
    closeDropdown();
  }

  async function changeColor(value: any) {
    if (isProcessing) return;
    isProcessing = true;
    await changeBackgroundColorValue(value);
    isProcessing = false;
  }

  setContext(OPEN_COLOR_PICKER_MENU, openColorPickerMenu);
  setContext(RETURN_TO_MAIN_MENU, returnToMainMenu);
  setContext(HOVER_ON_COLOR_CONTEXT_NAME, hoverOnColor);

  const configList: GridKeyControlConfig[][] = [];
  const gridKeyControlOptions: GridKeyControlActionOptions = {
    configList: configList,
  };

  onDestroy(() => {
    previewBackgroundColor(null);
  });

  $: if (element) {
    setTimeout(() => element.focus());
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  class="dropdown relative bg-white rounded h-[inherit] border-none outline-none overflow-y-auto overflow-x-hidden"
  class:disabled={isProcessing}
  use:gridKeyControlAction={gridKeyControlOptions}
  bind:this={element}
  tabindex={-1}
>
  {#if !showColorPickerMenu}
    <div class="tabs-container">
      <div class="tabs-list">
        {#each tabs as tab, i (tab.id)}
          <Tab
            {tab}
            {handleSwitchTab}
            ridx={0}
            cidx={i}
            {gridKeyControlOptions}
            scrollContainer={element}
          />
        {/each}
      </div>
    </div>

    <svelte:component
      this={activeTab.component}
      {gridKeyControlOptions}
      scrollContainer={element}
      startRowIndex={1}
      {changeColor}
    />
  {:else}
    <ColorPicker
      {cancelPickColor}
      {submitPickColor}
      {hexColor}
      scrollContainer={element}
    />
  {/if}
</div>

<style lang="postcss">
  .dropdown {
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .disabled :global(*) {
    @apply pointer-event-none;
  }

  .tabs-container {
    @apply mt-4 px-4 h-[17px];
    border-bottom: 1px solid #e6e6e6;
    box-sizing: border-box;
  }

  .tabs-list {
    @apply flex flex-row h-[15px] w-full mb-0.5;
  }
</style>
