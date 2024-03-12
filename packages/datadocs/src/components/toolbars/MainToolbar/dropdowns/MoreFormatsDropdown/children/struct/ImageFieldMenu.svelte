<script lang="ts">
  import type {
    CellDetailTypeData,
    CellStructFormat,
    StructDetailTypeData,
  } from "@datadocs/canvas-datagrid-ng";
  import {
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_TYPE_LIST,
    CLOSE_ROOT_MENU_CONTEXT_NAME,
  } from "../../../../../../common/menu";
  import type {
    MenuListType,
    MenuElementType,
    MenuItemType,
  } from "../../../../../../common/menu";
  import DropdownWrapper from "../../../../../../common/dropdown/DropdownWrapper.svelte";
  import Icon from "../../../../../../common/icons/Icon.svelte";
  import FormulaInput from "./FormulaInput.svelte";
  import { Menu } from "../../../../../../common/menu";
  import { bindComponent } from "../../../../../../../utils/bindComponent";
  import FieldItemLabel from "./FieldItemLabel.svelte";
  import { setContext } from "svelte";
  import { getDataTypeIcon } from "../../../../../../common/icons/utils";
  import { getCellDataFormatByIndex } from "../../../../../../../app/store/store-toolbar";

  export let structTypeData: StructDetailTypeData;
  export let cellRowIndex = -1;
  export let cellColumnIndex = -1;
  export let changeStructDataFormat: (
    format: CellStructFormat
  ) => Promise<void>;

  let menuItems: MenuItemType[] = buildMenuItems(structTypeData);
  let show: boolean = false;
  let activePath: string[] = [];
  let activeField: ReturnType<typeof getActiveField>;

  function toggleOpenDropdown(value?: boolean) {
    if (menuItems.length === 0) {
      show = false;
      return;
    }
    show = value ?? !show;
  }

  function closeRootMenu() {
    toggleOpenDropdown(false);
  }

  function initActiveField() {
    const currentFormat = getCellDataFormatByIndex(
      cellRowIndex,
      cellColumnIndex
    ) as CellStructFormat;

    activePath = currentFormat?.image;
    activeField = getActiveField(activePath);
  }

  async function onActiveFieldChange(path: string[]) {
    activePath = path;
    activeField = getActiveField(activePath);
    await handleSelectItem(activePath);
  }

  async function handleSelectItem(path: string[]) {
    const currentFormat = getCellDataFormatByIndex(
      cellRowIndex,
      cellColumnIndex
    ) as CellStructFormat;

    await changeStructDataFormat({
      type: "struct",
      format: "chip",
      display: currentFormat.display,
      image: path,
    });

    toggleOpenDropdown(false);

    // force update all data again
    structTypeData = structTypeData;
  }

  function buildMenuItems(
    data: StructDetailTypeData,
    path: string[] = []
  ): MenuItemType[] {
    if (data == null || typeof data === "string") {
      return [];
    }

    const MAX_ITEM_WIDTH = 350;
    const items: MenuItemType[] = [];

    for (const child of data.children) {
      const newPath = [...path, child.key];

      if (typeof child.dataType === "string") {
        if (child.dataType === "string") {
          // ONlY allow string type to be image fields
          const item: MenuElementType = {
            type: MENU_DATA_ITEM_TYPE_ELEMENT,
            label: bindComponent(FieldItemLabel, {
              key: child.key,
              dataType: child.dataType,
              style: `max-width: ${MAX_ITEM_WIDTH}px;`,
            }),
            state: MENU_DATA_ITEM_STATE_ENABLED,
            action: async () => {
              onActiveFieldChange(newPath);
            },
            style: `max-width: ${MAX_ITEM_WIDTH}px;`,
          };

          items.push(item);
        }
      } else {
        const menuItems = buildMenuItems(child.dataType, newPath);

        if (menuItems && menuItems.length > 0) {
          const item: MenuListType = {
            type: MENU_DATA_ITEM_TYPE_LIST,
            label: bindComponent(FieldItemLabel, {
              key: child.key,
              dataType: "struct",
              style: `max-width: calc(${MAX_ITEM_WIDTH}px - 32px);`,
            }),
            state: MENU_DATA_ITEM_STATE_ENABLED,
            children: menuItems,
            style: `max-width: ${MAX_ITEM_WIDTH}px;`,
          };

          items.push(item);
        }
      }
    }

    return items;
  }

  function getActiveField(path: string[]) {
    if (!path || path.length === 0) {
      // There is no custom path, image active field should be null
      return null;
    } else {
      // Find active field depend on path. If couldn't find it, take first
      // leaf node
      let isValid = true;
      let currentTypeData = structTypeData;
      let activeChild: { key: string; dataType: CellDetailTypeData };

      for (let i = 0; i < path.length; i++) {
        const child = currentTypeData.children.find(
          (child) => child.key === path[i]
        );
        if (i < path.length - 1) {
          if (typeof child.dataType === "string") {
            // There is more path to go, dataType has to be StructDetailTypeData
            isValid = false;
            break;
          } else {
            currentTypeData = child.dataType;
          }
        } else {
          // It should be the leaf node at the end of path
          if (typeof child.dataType !== "string") {
            isValid = false;
            break;
          } else {
            activeChild = child;
          }
        }
      }

      return isValid && activeChild.dataType === "string" ? activeChild : null;
    }
  }

  initActiveField();
  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, closeRootMenu);
</script>

<DropdownWrapper distanceToDropdown={1} autoWidth={true} bind:show>
  <div
    class="dropdown-button w-full"
    class:active={show}
    on:mousedown={() => toggleOpenDropdown()}
    slot="button"
  >
    <div class="flex flex-row items-center gap-1">
      {#if activeField}
        <div>
          <Icon
            icon={getDataTypeIcon(String(activeField.dataType))}
            width="34px"
            height="18px"
          />
        </div>

        <div style="width: calc(100% - 50px);max-width: calc(100% - 50px);">
          <div class="overflow-hidden overflow-ellipsis">
            {activeField.key}
          </div>
        </div>
      {:else}
        <div style="width: calc(100% - 8px);max-width: calc(100% - 8px);">
          None
        </div>
      {/if}

      <div class:active={show} class="arrow-dropdown-icon">
        <Icon
          icon="toolbar-arrow-dropdown"
          width="7px"
          height="4px"
          fill="currentColor"
        />
      </div>
    </div>
  </div>

  <div class="dropdown-menu" slot="content">
    <Menu data={menuItems} isRoot={true} isContextMenu={false} embeded={true} />
  </div>
</DropdownWrapper>

<style lang="postcss">
  .dropdown-button {
    @apply bg-white rounded w-full px-2.5 py-1.5 cursor-pointer text-13px font-medium;
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

  .arrow-dropdown-icon {
    @apply text-dark-50;
  }
</style>
