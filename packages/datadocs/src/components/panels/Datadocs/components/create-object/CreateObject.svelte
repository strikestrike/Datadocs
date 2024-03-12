<script lang="ts">
  import { getContext } from "svelte";
  import type {
    DatadocsFileSystemManager,
  } from "../file-system/datadocsFileSystemManager";
  import type { DatadocsFileSystemAction } from "../file-system/action";
  import {
    FILE_SYSTEM_ACTION_CONTEXT,
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  } from "../../../../common/file-system/flat-file-system/constant";
  import type { ContextMenuOptionsType } from "../../../../common/context-menu";
  import { bindComponent } from "../../../../../utils/bindComponent";
  import { contextMenuAction } from "../../../../common/context-menu";
  import {
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
  } from "../../../../common/menu";
  import CreateObjectItem from "./CreateObjectItem.svelte";
  import Icon from "../../../../common/icons/Icon.svelte";
  import iconAddObject from "./add.svg?raw";

  const fileSystemActions: DatadocsFileSystemAction = getContext(
    FILE_SYSTEM_ACTION_CONTEXT
  );
  const manager: DatadocsFileSystemManager = getContext(
    FILE_SYSTEM_STATE_MANAGER_CONTEXT
  );

  function addNewObject(name: string, type: "fd" | "wb") {
    fileSystemActions.addNewNodePlaceholder({
      parent: manager.getUIRoot()?.id ?? null,
      name,
      type,
    });
  }

  let showMenu = false;
  const contextMenuOptions: ContextMenuOptionsType = {
    menuItems: [
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        state: MENU_DATA_ITEM_STATE_ENABLED,
        get label() {
          return bindComponent(CreateObjectItem, {
            label: "Create Folder",
            icon: "panel-add-folder",
          });
        },
        action: () => {
          if (manager.hasSearch()) {
            return;
          }
          addNewObject("New Folder", "fd");
        },
      },
      {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        state: MENU_DATA_ITEM_STATE_ENABLED,
        get label() {
          return bindComponent(CreateObjectItem, {
            label: "Create Workbook",
            icon: "panel-file",
          });
        },
        action: () => {
          if (manager.hasSearch()) {
            return;
          }
          addNewObject("New Workbook", "wb");
        },
      },
    ],
    disabled: false,
    useClickEvent: true,
    onOpen: () => {
      showMenu = true;
    },
    onClose: () => {
      showMenu = false;
    },
  };
</script>

<div
  class="p-1 cursor-pointer rounded text-pink-100"
  class:selected={showMenu}
  use:contextMenuAction={contextMenuOptions}
>
  {@html iconAddObject}
</div>

<style lang="postcss">
  div:hover,
  div.selected {
    @apply bg-primary-datadocs-blue bg-opacity-10;
  }
</style>
