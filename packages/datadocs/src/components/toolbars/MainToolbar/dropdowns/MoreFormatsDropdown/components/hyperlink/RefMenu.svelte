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
  import { getContext, onMount, setContext, tick } from "svelte";
  import {
    getTableColumnsAt,
    updateHyperlinkDataFormat,
  } from "../../../../../../../app/store/store-toolbar";
  import Icon from "../../../../../../common/icons/Icon.svelte";
  import { FIRST_SELECTED_STRING_DATA } from "../../util";
  import { bind } from "../../../../../../common/modal";
  import TableFieldSelect from "./TableFieldSelect.svelte";
  import {
    MAX_ITEM_WIDTH,
    checkMissingLinkRef,
    getTableStringColumnsAt,
  } from "./util";
  import TableFieldButton from "./TableFieldButton.svelte";
  import ArrowIcon from "./ArrowIcon.svelte";
  import {
    CLOSE_DROPDOWN_CONTEXT_NAME,
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME,
  } from "../../../../../../common/dropdown";

  export let format: CellHyperlinkFormat;

  const firstString: SelectionDataTypeListInformation["firstString"] =
    getContext(FIRST_SELECTED_STRING_DATA);
  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );
  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);

  let show = false;
  let menuItems: MenuItemType[] = [];
  let inputValue: string = "";
  let inputElement: HTMLInputElement;
  let disableChangeDataFormat = false;
  let tableColumns: ReturnType<typeof getTableColumnsAt> = [];
  let activeColumnId: string;
  let columnRef = false;
  let customRef = false;
  let noRef = false;
  let missingLinkRef = false;

  function buildMenuOptions(): MenuItemType[] {
    const items: MenuItemType[] = [];
    // Add table items
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
            style: "rcolumn",
            value: column.id,
          };
          await changeDataFormat(newFormat);
        },
        style: `max-width: ${MAX_ITEM_WIDTH}px;`,
      };
      items.push(item);
    }
    // Add default items
    if (Array.isArray(tableColumns) && tableColumns.length > 0) {
      items.push(MENU_HORIZONTAL_SEPARATOR);
    }
    const customLabelItem: MenuElementType = {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Custom text or formula",
      get active() {
        return customRef;
      },
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: async () => {
        await updateCustomHyperlink();
      },
      style: `max-width: ${MAX_ITEM_WIDTH}px;`,
    };
    items.push(customLabelItem);
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
      style: "rtext",
      value: inputElement?.value ?? null,
    };
    await changeDataFormat(newFormat);
  }

  async function onCustomHyperlinkChange(event: KeyboardEvent) {
    if (!disableChangeDataFormat && event.key === "Enter") {
      await updateCustomHyperlink();
      disableChangeDataFormat = true;
      closeDropdown();
    }
  }

  function onKeyUp() {
    disableChangeDataFormat = false;
  }

  async function changeDataFormat(newFormat: CellHyperlinkFormat) {
    await updateHyperlinkDataFormat(newFormat);
    format = newFormat;
    missingLinkRef = checkMissingLinkRef(
      firstString.rowIndex,
      firstString.columnIndex
    );
    await tick();
    updateDropdownStyle();
  }

  async function initMenuOptions() {
    tableColumns =
      getTableStringColumnsAt(firstString.rowIndex, firstString.columnIndex) ??
      [];
    menuItems = buildMenuOptions();
  }

  function checkActiveColumn() {
    return !!tableColumns.find((col) => {
      return col.id === format.value;
    });
  }

  // If the cell is Hyperlink data format but there is no associated url,
  // we have to open up the menu for user to create/select one (according
  // to the design).
  async function openDropdownOnStart() {
    if (missingLinkRef) {
      await tick();
      toggleOpenDropdown(true);
    }
  }

  onMount(() => {
    openDropdownOnStart();
  });

  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, closeRootMenu);

  $: if (customRef) {
    inputValue = format.value ?? "";
  }
  $: if (format) {
    initMenuOptions();
    columnRef =
      format.style === "rcolumn" &&
      format.value &&
      Array.isArray(tableColumns) &&
      tableColumns.length > 0 &&
      checkActiveColumn();
    activeColumnId = columnRef ? format.value : null;
    customRef = format.style === "rformula" || format.style === "rtext";
    noRef = format?.style === "rempty" || (!columnRef && !customRef);
  }
  $: missingLinkRef = checkMissingLinkRef(
    firstString.rowIndex,
    firstString.columnIndex
  );
</script>

<div class:hidden={!format} class:custom-ref-container={customRef}>
  <div class:custom-ref-button={customRef}>
    <DropdownWrapper distanceToDropdown={1} autoWidth={true} bind:show>
      <div
        class="dropdown-button flex flex-row items-center gap-1"
        class:active={show}
        on:mousedown={() => toggleOpenDropdown()}
        slot="button"
      >
        <div class="w-full overflow-hidden overflow-ellipsis whitespace-nowrap">
          {#if noRef}
            <span class="text-dark-50 font-normal">(Select)</span>
          {:else if customRef}
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

  {#if customRef}
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

{#if missingLinkRef}
  <div
    class="flex flex-row items-center gap-1 mt-1.5 ml-0.5 text-11px text-tertiary-error"
  >
    <div>
      <Icon icon="input-form-error" size="12px" />
    </div>

    <div>Hyperlink must have a url associated.</div>
  </div>
{/if}

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

  .custom-ref-container {
    @apply flex flex-row items-center max-w-full gap-2;
  }

  .custom-ref-button {
    @apply w-20 grow-0 shrink-0;
  }
</style>
