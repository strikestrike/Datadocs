<script lang="ts">
  import { getContext, tick } from "svelte";
  import type { WorkspaceItem } from "../../../../../app/store/types";
  import {
    switchWorkspace,
    isWorkspaceRemovable,
    removeWorkspace,
  } from "./utils";
  import Icon from "../../../../common/icons/Icon.svelte";
  import DeleteConfirmationModal from "../../modals/DeleteConfirmationModal.svelte";
  import { openModal } from "../../../../common/modal/store-modal";
  import type { ModalConfigType } from "../../../../common/modal/index";
  import { CLOSE_ROOT_MENU_CONTEXT_NAME } from "../../../../common/menu";
  import { registerElement } from "../../../../common/key-control/listKeyControl";
  import type {
    RegisterElementOptions,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";
  import { bind } from "../../../../common/modal/modalBind";

  export let workspace: WorkspaceItem;
  export let keyControlActionOptions: KeyControlActionOptions;
  export let index: number;
  export let scrollContainer: HTMLElement = null;

  const closeMainDropdown: () => void = getContext(
    CLOSE_ROOT_MENU_CONTEXT_NAME
  );
  const isRemoveable = isWorkspaceRemovable(workspace);
  let element: HTMLElement;
  let isSelected = false;

  function handleSelectWorkspace(workspace: WorkspaceItem) {
    switchWorkspace(workspace.id);
    closeMainDropdown();
  }

  function handleDeleteWorkspace(workspace: WorkspaceItem) {
    const isMovable = false;
    const isResizable = false;
    const deleteWsProps = {
      mainMessage: `Are you sure you want to delete “${workspace.name}” ?`,
      sideMessages: [
        "Please be 100% sure about your decision as you will no longer be",
        "able to recover this workspace after deleting it.",
      ],
      title: `Delete “${workspace.name}”`,
      executeOnYes: async () => {
        await removeWorkspace(workspace);
      },
      isMovable: isMovable,
    };
    const modalElement = bind(DeleteConfirmationModal, deleteWsProps);
    const modalConfig: ModalConfigType = {
      component: modalElement,
      isMovable: isMovable,
      isResizable: isResizable,
      minWidth: 400,
      minHeight: 300,
      preferredWidth: 500,
    };

    openModal(modalConfig);
    closeMainDropdown();
  }

  async function onSelectCallback(byKey = true) {
    isSelected = true;
    if (!byKey) {
      return;
    }
    await tick();
    scrollVerticalToVisible(scrollContainer, element);
  }

  function onDeselectCallback() {
    isSelected = false;
  }

  function onEnterKeyCallback(event: KeyboardEvent) {
    if (event.key === "Enter" && isSelected) {
      handleSelectWorkspace(workspace);
    }
  }

  const options: RegisterElementOptions = {
    config: {
      isSelected: false,
      index,
      onSelectCallback,
      onDeselectCallback,
      onEnterKeyCallback,
    },
    configList: keyControlActionOptions.configList,
    index,
  };
</script>

<div
  bind:this={element}
  class="workspace-element mx-1.5 px-3.5 py-1.5 rounded cursor-pointer"
  class:selected={isSelected}
  on:click={() => handleSelectWorkspace(workspace)}
  use:registerElement={options}
>
  <div class="flex flex-row items-center w-full justify-between">
    <div class="workspace-name flex flex-row items-center">
      <div
        class="mr-2 flex-shrink-0"
        class:tick-sign-inactive={!workspace.isActive}
      >
        <Icon icon="top-menu-item-tick" size="21px" />
      </div>

      <div
        class="text-13px h-5 font-medium flex-shrink whitespace-nowrap overflow-hidden overflow-ellipsis"
      >
        {workspace.name}
      </div>
    </div>

    <div
      class="delete-workspace ml-2 opacity-0"
      class:delete-inactive={!isRemoveable}
      on:click|stopPropagation={() => handleDeleteWorkspace(workspace)}
    >
      <Icon icon="top-menu-view-delete-workspace" size="14px" />
    </div>
  </div>
</div>

<style lang="postcss">
  .selected .delete-workspace:not(.delete-inactive) {
    @apply opacity-100;
  }

  .delete-inactive {
    @apply opacity-0 pointer-events-none;
  }

  .workspace-name {
    width: calc(100% - 22px);
  }

  .tick-sign-inactive {
    @apply opacity-0;
  }

  .selected {
    @apply bg-dropdown-item-hover-bg;
  }
</style>
