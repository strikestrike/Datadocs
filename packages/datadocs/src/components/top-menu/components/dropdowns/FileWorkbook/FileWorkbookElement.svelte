<script lang="ts">
  import { getContext, tick } from "svelte";
  import type { Workbook } from "../../../../../app/store/types";
  import Icon from "../../../../common/icons/Icon.svelte";
  import DeleteConfirmationModal from "../../modals/DeleteConfirmationModal.svelte";
  import { openModal } from "../../../../common/modal/store-modal";
  import { CLOSE_ROOT_MENU_CONTEXT_NAME } from "../../../../common/menu";
  import { registerElement } from "../../../../common/key-control/listKeyControl";
  import type {
    RegisterElementOptions,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";
  import { bind } from "../../../../common/modal/modalBind";
  import { switchWorkbook, workbookListStore } from "../../../../../app/store/store-workbooks";
  import { deleteWorkbook } from "../../../../../api"; 

  export let workbook: Workbook;
  export let keyControlActionOptions: KeyControlActionOptions;
  export let index: number;
  export let scrollContainer: HTMLElement = null;
  export let isActive = false;

  const closeMainDropdown: () => void = getContext(
    CLOSE_ROOT_MENU_CONTEXT_NAME
  );
  const isRemoveable = !isActive;
  let element: HTMLElement;
  let isSelected = false;

  function handleSelectWorkbook(workbook: Workbook) {
    switchWorkbook(workbook.id);
    closeMainDropdown();
  }

  function handleDeleteWorkbook(workbook: Workbook) {
    const isMovable = false;
    const isResizable = false;
    const deleteWsProps = {
      mainMessage: `Are you sure you want to delete “${workbook.name}” ?`,
      sideMessages: [
        "Please be 100% sure about your decision as you will no longer be",
        "able to recover this workbook after deleting it.",
      ],
      title: `Delete “${workbook.name}”`,
      executeOnYes: async () => {
        await deleteWorkbook(workbook.id, {
          onSuccess: async (data) => {
            workbookListStore.update(wbList => {
              const index = wbList.findIndex(wb => wb.id === workbook.id);
              wbList.splice(index, 1);
              return wbList;
            });
          },
          onError: async (error) => {
          }
        });
      },
      isMovable: isMovable,
    };
    const modalElement = bind(DeleteConfirmationModal, deleteWsProps);
    const modalConfig = {
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

  async function onSelectCallback(byKey: boolean = true) {
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
      handleSelectWorkbook(workbook);
    }
  }

  let options: RegisterElementOptions = {
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

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={element}
  class="workspace-element mx-1.5 px-3.5 py-1.5 rounded cursor-pointer"
  class:selected={isSelected}
  on:click={() => handleSelectWorkbook(workbook)}
  use:registerElement={options}
>
  <div class="flex flex-row items-center w-full justify-between">
    <div class="workspace-name flex flex-row items-center">
      <div
        class="mr-2 flex-shrink-0"
        class:tick-sign-inactive={!isActive}
      >
        <Icon icon="top-menu-item-tick" size="21px" />
      </div>

      <div
        class="text-13px h-5 font-medium flex-shrink flex flex-row items-center whitespace-nowrap overflow-hidden overflow-ellipsis"
      >
        {workbook.name}
      </div>
    </div>

    <div
      class="delete-workspace ml-2 opacity-0"
      class:delete-inactive={!isRemoveable}
      on:click|stopPropagation={() => handleDeleteWorkbook(workbook)}
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
