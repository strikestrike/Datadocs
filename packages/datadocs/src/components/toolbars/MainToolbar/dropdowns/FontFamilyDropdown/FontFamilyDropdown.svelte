<script lang="ts">
  import { onMount, setContext, getContext } from "svelte";
  import { writable, get, type Writable } from "svelte/store";
  import {
    changeFontFamilyValue,
    getRecentlyUsedFonts,
    setRecentlyUsedFonts,
    GRID_DEFAULT_FONT_FAMILY,
    previewFontFamily,
    removeStylePreview,
  } from "../../../../../app/store/store-toolbar";
  import { fontFamilyValue } from "../../../../../app/store/writables";
  import {
    getNewRecentlyUsedFontFamily,
    isValueInFontFamilyItem,
  } from "./utils";
  import type {
    FontFamilyDataItem,
    FontFamilyDataFont,
    FontFamilyDataList,
  } from "../default";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_TYPE_LIST,
    MENU_DATA_ITEM_STATE_ENABLED,
    MOUSE_ON_ROOT_MENU_CONTEXT_NAME,
    MOUSE_OVER_TARGET_CONTEXT_NAME,
    IS_IN_LEAF_MENU_CONTEXT_NAME,
    IS_IN_PARENT_OF_LEAF_MENU_CONTEXT_NAME,
    CONTROL_MENU_BY_KEY_CONTEXT_NAME,
    SUBMENU_CHANGE_CONTEXT_NAME,
    MENU_CLASSNAME,
    CLOSE_ROOT_MENU_CONTEXT_NAME,
  } from "../../../../common/menu";
  import type {
    MenuItemType,
    MenuElementType,
    MenuListType,
  } from "../../../../common/menu";
  import type {
    KeyControlActionOptions,
    KeyControlConfig,
  } from "../../../../common/key-control/listKeyControl";
  import { keyControlAction } from "../../../../common/key-control/listKeyControl";
  import FontFamilyMenu from "./FontFamilyMenu.svelte";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, () => {});

  const recentlyUsedFonts: FontFamilyDataItem[] = getRecentlyUsedFonts();
  const defaultFonts: FontFamilyDataItem[] = [
    { type: "font", value: GRID_DEFAULT_FONT_FAMILY, label: "Default (Arial)" },
  ];
  const fonts: FontFamilyDataItem[] = [
    {
      type: "font",
      value: "Amatic SC",
      label: "Amatic SC",
    },
    {
      type: "font",
      value: "Arial",
      label: "Arial",
    },
    {
      type: "list",
      label: "Caveat",
      value: "Caveat",
      fonts: [
        {
          type: "font",
          value: "Caveat",
          label: "Caveat",
        },
        {
          type: "font",
          value: "Caveat Brush",
          label: "Caveat Brush",
        },
      ],
    },
    {
      type: "font",
      value: "Comfortaa",
      label: "Comfortaa",
    },
    {
      type: "font",
      value: "Comic Sans MS",
      label: "Comic Sans MS",
    },
    {
      type: "font",
      value: "Courier New",
      label: "Courier New",
    },
    {
      type: "font",
      value: "EB Garamond",
      label: "EB Garamond",
    },
    {
      type: "font",
      value: "Franklin Gothic",
      label: "Franklin Gothic",
    },
    {
      type: "font",
      value: "Georgia",
      label: "Georgia",
    },
    {
      type: "font",
      value: "Gill Sans",
      label: "Gill Sans",
    },
    {
      type: "font",
      value: "Helvetica Neue",
      label: "Helvetica Neue",
    },
    {
      type: "font",
      value: "Impact",
      label: "Impact",
    },
    {
      type: "list",
      label: "Lobster",
      value: "Lobster",
      fonts: [
        {
          type: "font",
          value: "Lobster",
          label: "Lobster",
        },
        {
          type: "font",
          value: "Lobster Two",
          label: "Lobster Two",
        },
      ],
    },
    {
      type: "font",
      value: "Lora",
      label: "Lora",
    },
    {
      type: "font",
      value: "Merriweather",
      label: "Merriweather",
    },
    {
      type: "font",
      value: "Montserrat",
      label: "Montserrat",
    },
    {
      type: "font",
      value: "Nunito",
      label: "Nunito",
    },
    {
      type: "font",
      value: "Oswald",
      label: "Oswald",
    },
    {
      type: "font",
      value: "Pacifico",
      label: "Pacifico",
    },
    {
      type: "font",
      value: "Playfair Display",
      label: "Playfair Display",
    },
    {
      type: "font",
      value: "Poppins",
      label: "Poppins",
    },
    {
      type: "list",
      label: "Roboto",
      value: "Roboto",
      fonts: [
        {
          type: "font",
          value: "Roboto",
          label: "Roboto",
        },
        {
          type: "font",
          value: "Roboto Condensed",
          label: "Roboto Condensed",
        },
        {
          type: "font",
          value: "Roboto Mono",
          label: "Roboto Mono",
        },
        {
          type: "font",
          value: "Roboto Slab",
          label: "Roboto Slab",
        },
      ],
    },
    {
      type: "font",
      value: "Spectral",
      label: "Spectral",
    },
    {
      type: "font",
      value: "Times New Roman",
      label: "Times New Roman",
    },
    {
      type: "font",
      value: "Trebuchet MS",
      label: "Trebuchet MS",
    },
    {
      type: "font",
      value: "Verdana",
      label: "Verdana",
    },
  ];
  const activeValue = get(fontFamilyValue);
  let isLeafMenu = true;
  let isParentOfLeafMenu = false;
  let menuElement: HTMLElement;
  let scrollContainer: HTMLElement = null;
  const mouseOnMenuDropdown: Writable<boolean> = writable(false);
  const mouseOverTarget: Writable<HTMLElement> = writable(null);
  let previousMouseOnDropdown = false;
  let controlMenuByKey = false;
  const configList: KeyControlConfig[] = [];
  let disabledKeyControl = false;
  let keyControlOptions: KeyControlActionOptions = {
    configList: configList,
    disabled: disabledKeyControl,
  };
  let isProcessing = false;

  function sectionTitle(title: string) {
    return `
      <div class="mx-1.5 px-3.5 py-1.5">
        <div
          style="font-family: Poppins; font-size: 11px; line-height: 16px;"
          class="not-italic font-semibold leading-normal uppercase text-[#A7B0B5]"
        >
          ${title}
        <div>
      <div>
    `;
  }

  const sectionSeparator = `
    <div class="block">
      <div class="border-b border-separator-line-color h-1px my-1.5" />
    </div>
  `;

  async function handleSelectItem(value: string, isDefault: boolean) {
    if (isProcessing) {
      return;
    }
    isProcessing = true;

    // update recently use fonts only if the item is not default font
    if (!isDefault) {
      const newRecentlyUsedFonts = getNewRecentlyUsedFontFamily(
        recentlyUsedFonts,
        fonts,
        value
      );
      setRecentlyUsedFonts(newRecentlyUsedFonts);
    }
    await changeFontFamilyValue(value);
    closeDropdown();
  }

  function fontToMenuItem(
    items: FontFamilyDataItem[],
    isRoot = true,
    isDefault = false
  ): MenuItemType[] {
    const result: MenuItemType[] = [];

    function getLabel(item: FontFamilyDataItem): string {
      const isSelected = isValueInFontFamilyItem(item, activeValue.value);
      const color = isSelected ? "#3bc7ff" : "inherit";
      const fontWeight = isSelected ? "700" : "500";
      const style = `font-family: ${item.value}; font-size: 13px; color: ${color}; font-weight: ${fontWeight};`;
      return `<div style="${style}" data-grideditorcompanion="true">${item.label}</div>`;
    }

    function getElementStyle(isRoot: boolean): string {
      const paddingLeft = isRoot ? "22px" : "14px";
      const paddingRight = "14px";
      const borderRadius = "2px";
      return `padding-left: ${paddingLeft}; padding-right: ${paddingRight}; border-radius: ${borderRadius};`;
    }

    function getMenuElementData(
      item: FontFamilyDataFont,
      isRoot: boolean
    ): MenuElementType {
      const element: MenuElementType = {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        get label() {
          return getLabel(item);
        },
        state: MENU_DATA_ITEM_STATE_ENABLED,
        action: async () => {
          await handleSelectItem(item.value, isDefault);
        },
        enterAction: () => {
          previewFontFamily(item.value);
        },
        leaveAction: () => {
          removeStylePreview();
        },
        style: getElementStyle(isRoot),
      };

      return element;
    }

    function getMenulistData(
      item: FontFamilyDataList,
      isRoot: boolean
    ): MenuListType {
      const element: MenuListType = {
        type: MENU_DATA_ITEM_TYPE_LIST,
        get label() {
          return getLabel(item);
        },
        state: MENU_DATA_ITEM_STATE_ENABLED,
        get children() {
          return fontToMenuItem(item.fonts, false);
        },
        style: getElementStyle(isRoot),
      };

      return element;
    }

    for (const item of items) {
      if (item.type === "list") {
        result.push(getMenulistData(item, isRoot));
      } else {
        result.push(getMenuElementData(item, isRoot));
      }
    }

    return result;
  }

  function handleWindowMouseOver(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const isOverDropdown = menuElement.contains(target);

    if (previousMouseOnDropdown !== isOverDropdown) {
      mouseOnMenuDropdown.set(isOverDropdown);
      previousMouseOnDropdown = isOverDropdown;
    }

    if (isOverDropdown) {
      controlMenuByKey = false;
    }

    mouseOverTarget.set(target);
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Enter" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight"
    ) {
      controlMenuByKey = true;
    }
  }

  onMount(() => {
    document.addEventListener("mouseover", handleWindowMouseOver, true);
    document.addEventListener("keydown", handleWindowKeydown, true);
    return () => {
      document.removeEventListener("mouseover", handleWindowMouseOver, true);
      document.removeEventListener("keydown", handleWindowKeydown, true);
      removeStylePreview();
    };
  });

  function onSubmenuChange() {
    const numberOfChildMenu = menuElement.querySelectorAll(
      `.${MENU_CLASSNAME}`
    ).length;
    isLeafMenu = numberOfChildMenu === 0;
    isParentOfLeafMenu = numberOfChildMenu === 1;
  }

  setContext(MOUSE_ON_ROOT_MENU_CONTEXT_NAME, mouseOnMenuDropdown);
  setContext(MOUSE_OVER_TARGET_CONTEXT_NAME, mouseOverTarget);
  setContext(CONTROL_MENU_BY_KEY_CONTEXT_NAME, () => {
    return controlMenuByKey;
  });
  setContext(IS_IN_LEAF_MENU_CONTEXT_NAME, () => {
    return isLeafMenu;
  });
  setContext(IS_IN_PARENT_OF_LEAF_MENU_CONTEXT_NAME, () => {
    return isParentOfLeafMenu;
  });
  setContext(SUBMENU_CHANGE_CONTEXT_NAME, onSubmenuChange);

  $: disabledKeyControl = !isLeafMenu;
  $: keyControlOptions = {
    ...keyControlOptions,
    disabled: disabledKeyControl,
  };
</script>

<div
  bind:this={menuElement}
  class="dropdown"
  class:disabled={isProcessing}
  use:keyControlAction={keyControlOptions}
>
  <div class="w-full h-1.5 flex-shrink-0" />

  {#if defaultFonts.length > 0}
    {@html sectionTitle("DEFAULT")}

    <FontFamilyMenu
      data={fontToMenuItem(defaultFonts, true, true)}
      startIndex={0}
      {keyControlOptions}
    />

    {@html sectionSeparator}
  {/if}

  {#if recentlyUsedFonts.length > 0}
    {@html sectionTitle("RECENTLY USED")}

    <FontFamilyMenu
      data={fontToMenuItem(recentlyUsedFonts)}
      startIndex={1}
      {keyControlOptions}
    />

    {@html sectionSeparator}
  {/if}

  {@html sectionTitle("All fonts")}

  <div
    bind:this={scrollContainer}
    class="overflow-y-auto overflow-x-hidden flex-grow"
  >
    <FontFamilyMenu
      data={fontToMenuItem(fonts)}
      {scrollContainer}
      startIndex={10}
      {keyControlOptions}
    />
  </div>

  <div class="w-full h-1.5 flex-shrink-0" />
</div>

<style lang="postcss">
  .dropdown {
    @apply flex flex-col h-full bg-white rounded;
    min-height: 280px;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .disabled :global(*) {
    @apply pointer-event-none;
  }
</style>
