<script lang="ts">
  import type {
    CellHyperlinkFormat,
    SelectionDataTypeListInformation,
  } from "@datadocs/canvas-datagrid-ng";
  import {
    CLOSE_ROOT_MENU_CONTEXT_NAME,
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_HORIZONTAL_SEPARATOR,
  } from "../../../../../../common/menu";
  import type {
    MenuElementType,
    MenuItemType,
  } from "../../../../../../common/menu";
  import DropdownWrapper from "../../../../../../common/dropdown/DropdownWrapper.svelte";
  import Menu from "../../../../../../common/menu/Menu.svelte";
  import { getContext, setContext } from "svelte";
  import {
    getTableColumnsAt,
    updateHyperlinkDataFormat,
  } from "../../../../../../../app/store/store-toolbar";
  import { FIRST_SELECTED_STRING_DATA } from "../../util";
  import { bind } from "../../../../../../common/modal";
  import TableFieldSelect from "./TableFieldSelect.svelte";
  import { MAX_ITEM_WIDTH, getTableStringColumnsAt } from "./util";
  import TableFieldButton from "./TableFieldButton.svelte";
  import ArrowIcon from "./ArrowIcon.svelte";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../../../common/dropdown";

  export let format: CellHyperlinkFormat;

  const firstString: SelectionDataTypeListInformation["firstString"] =
    getContext(FIRST_SELECTED_STRING_DATA);
  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);

  let show = false;
  let menuItems: MenuItemType[] = [];
  let inputValue: string = "";
  let inputElement: HTMLInputElement;
  let disableChangeDataFormat = false;
  let tableColumns: ReturnType<typeof getTableColumnsAt> = [];
  let activeColumnId: string;
  let columnLabel = false;
  let customLabel = false;
  let noLabel = false;

  function buildMenuOptions(): MenuItemType[] {
    const items: MenuItemType[] = [];

    // Add default items
    const noLabelItem: MenuElementType = {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "No Label",
      get active() {
        return noLabel;
      },
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: async () => {
        const newFormat: CellHyperlinkFormat = {
          type: "string",
          format: "Hyperlink",
          style: "lempty",
        };
        await changeDataFormat(newFormat);
      },
      style: `max-width: ${MAX_ITEM_WIDTH}px;`,
    };
    const customLabelItem: MenuElementType = {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Custom text or formula",
      get active() {
        return customLabel;
      },
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: async () => {
        await updateCustomHyperlink();
      },
      style: `max-width: ${MAX_ITEM_WIDTH}px;`,
    };

    items.push(noLabelItem, customLabelItem);

    // Add table items
    if (Array.isArray(tableColumns) && tableColumns.length > 0) {
      items.push(MENU_HORIZONTAL_SEPARATOR);

      for (const column of tableColumns) {
        const item: MenuElementType = {
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: bind(TableFieldSelect, { label: column.id }),
          get active() {
            return false;
          },
          state: MENU_DATA_ITEM_STATE_ENABLED,
          action: async () => {
            const newFormat: CellHyperlinkFormat = {
              type: "string",
              format: "Hyperlink",
              style: "lcolumn",
              value: column.id,
            };
            await changeDataFormat(newFormat);
          },
          style: `max-width: ${MAX_ITEM_WIDTH}px;`,
        };

        items.push(item);
      }
    }

    return items;
  }

  function toggleOpenDropdown(value?: boolean) {
    show = value ?? !show;
  }

  function closeRootMenu() {
    toggleOpenDropdown(false);
  }

  async function updateCustomHyperlink() {
    const newFormat: CellHyperlinkFormat = {
      type: "string",
      format: "Hyperlink",
      style: "ltext",
      value: inputElement?.value ?? null,
    };
    await changeDataFormat(newFormat);
  }

  async function changeDataFormat(newFormat: CellHyperlinkFormat) {
    await updateHyperlinkDataFormat(newFormat);
    format = newFormat;
  }

  async function onCustomHyperlinkChange(event: KeyboardEvent) {
    if (!disableChangeDataFormat && event.key === "Enter") {
      await updateCustomHyperlink();
      disableChangeDataFormat = true;
      closeDropdown();
    }
  }

  /**
   * The key up event handler is to make sure there is only one "Enter" key
   * make changes to the data format.
   *
   * NOTE: We can't make use of keypress or keyup event directly because they
   * aren't fired if a Meta key is still pressed and we must have meta key for
   * doing entire column data-format.
   */
  function onKeyUp() {
    disableChangeDataFormat = false;
  }

  async function initMenuOptions() {
    tableColumns =
      getTableStringColumnsAt(firstString.rowIndex, firstString.columnIndex) ??
      [];
    menuItems = buildMenuOptions();
  }

  function checkActiveColumn(columnId: string) {
    return !!tableColumns.find((col) => {
      return col.id === format.value;
    });
  }

  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, closeRootMenu);

  $: if (customLabel) {
    inputValue = format.value ?? "";
  }

  $: if (format) {
    initMenuOptions();
    columnLabel =
      format.style === "lcolumn" &&
      format.value &&
      Array.isArray(tableColumns) &&
      tableColumns.length > 0 &&
      checkActiveColumn(format.value);
    activeColumnId = columnLabel ? format.value : null;
    customLabel = format.style === "lformula" || format.style === "ltext";
    noLabel = format?.style === "lempty" || (!columnLabel && !customLabel);
  }
</script>

<div class:hidden={!format} class:custom-label-container={customLabel}>
  <div class:custom-label-button={customLabel}>
    <DropdownWrapper distanceToDropdown={1} autoWidth={true} bind:show>
      <div
        class="dropdown-button flex flex-row items-center gap-1"
        class:active={show}
        on:mousedown={() => toggleOpenDropdown()}
        slot="button"
      >
        <div class="w-full overflow-hidden overflow-ellipsis whitespace-nowrap">
          {#if noLabel}
            No label
          {:else if customLabel}
            Custom text or formula
          {:else}
            <TableFieldButton label={activeColumnId} />
          {/if}
        </div>

        <ArrowIcon active={show} />
      </div>

      <div class="dropdown-menu" slot="content">
        <Menu
          data={menuItems}
          isRoot={true}
          isContextMenu={false}
          embeded={true}
        />
      </div>
    </DropdownWrapper>
  </div>

  {#if customLabel}
    <div class="w-full">
      <input
        bind:this={inputElement}
        on:keydown={onCustomHyperlinkChange}
        on:keyup={onKeyUp}
        class="w-full px-2 py-1.5 bg-light-100 rounded outline-none"
        type="text"
        value={inputValue}
      />
    </div>
  {/if}
</div>

<style lang="postcss">
  .dropdown-button {
    @apply bg-white rounded w-full pl-2 pr-1.5 py-1.5 cursor-pointer text-13px font-medium;
    @apply border border-light-100;
  }

  .dropdown-button:hover,
  .dropdown-button.active {
    box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.16);
  }

  .dropdown-menu {
    @apply bg-white rounded py-1.5;
    max-height: 100%;
    overflow-y: auto;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .custom-label-container {
    @apply flex flex-row items-center max-w-full gap-2;
  }

  .custom-label-button {
    @apply w-20 grow-0 shrink-0;
  }
</style>
