<script lang="ts">
  import { getContext } from "svelte";
  import type { DatadocsFileSystemManager } from "../file-system/datadocsFileSystemManager";
  import type { DatadocsFileSystemAction } from "../file-system/action";
  import {
    FILE_SYSTEM_ACTION_CONTEXT,
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  } from "../../../../common/file-system/flat-file-system/constant";
  import type { ContextMenuOptionsType } from "../../../../common/context-menu";
  import { bindComponent } from "../../../../../utils/bindComponent";
  import { contextMenuAction } from "../../../../common/context-menu";
  import {
    MENU_DATA_ITEM_STATE_DISABLED,
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
  } from "../../../../common/menu";
  import SortMenuItem from "./SortMenuItem.svelte";
  import Icon from "../../../../common/icons/Icon.svelte";
  import type { DatadocsPanelListDirSort } from "../../../../../api";

  const fileSystemActions: DatadocsFileSystemAction = getContext(
    FILE_SYSTEM_ACTION_CONTEXT,
  );
  const stateManager: DatadocsFileSystemManager = getContext(
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  );

  let showSortMenu = false;

  function isSortActive(sortType: DatadocsPanelListDirSort) {
    return stateManager.sortType === sortType;
  }

  const contextMenuOptions: ContextMenuOptionsType = {
    menuItems: [
      // { type: MENU_DATA_ITEM_TYPE_TITLE, title: "SORT BY" },
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        state: MENU_DATA_ITEM_STATE_DISABLED,
        label: `<div class="text-11px font-semibold text-dark-50">SORT BY</div>`,
        action: () => {},
      },
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        state: MENU_DATA_ITEM_STATE_ENABLED,
        get label() {
          return bindComponent(SortMenuItem, {
            label: "Name",
            isActive: isSortActive("name:asc"),
          });
        },
        action: () => {
          if (isSortActive("name:asc")) {
            fileSystemActions.sort("default");
          } else {
            fileSystemActions.sort("name:asc");
          }
        },
      },
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        state: MENU_DATA_ITEM_STATE_ENABLED,
        get label() {
          return bindComponent(SortMenuItem, {
            label: "Most recent",
            isActive: isSortActive("access:desc"),
          });
        },
        action: () => {
          if (isSortActive("access:desc")) {
            fileSystemActions.sort("default");
          } else {
            fileSystemActions.sort("access:desc");
          }
        },
      },
    ],
    disabled: false,
    useClickEvent: true,
    onOpen: () => {
      showSortMenu = true;
    },
    onClose: () => {
      showSortMenu = false;
    },
  };
</script>

<div
  class="p-1 cursor-pointer rounded {showSortMenu
    ? 'text-primary-datadocs-blue'
    : 'text-dark-300'}"
  class:selected={showSortMenu}
  use:contextMenuAction={contextMenuOptions}
>
  <Icon icon="panel-sort" size="20px" />
</div>

<style lang="postcss">
  div:hover,
  div.selected {
    @apply bg-primary-datadocs-blue bg-opacity-10;
  }
</style>
