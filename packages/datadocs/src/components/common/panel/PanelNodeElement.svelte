<script lang="ts">
  import { createEventDispatcher, tick } from "svelte";
  import Icon from "../icons/Icon.svelte";
  import {
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
    type MenuItemType,
  } from "../menu";
  import {
    contextMenuAction,
    type ContextMenuOptionsType,
  } from "../context-menu";

  /**
   * Whether node name is editable or not
   */
  export let editable = true;
  export let label: string;
  export let triggerEdit: () => void;
  export let moreButtonItems: MenuItemType[] = [
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Rename",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: () => {
        triggerEdit();
      },
    },
  ];
  export let contextMenuItems: MenuItemType[] = moreButtonItems;
  /**
   * Edit node name logic
   */
  export let handleEditNodeName = async (name: string) => {};
  /**
   * This function will be called before ending the editing process,
   * regardless if user press `enter` or `click` outside of the input
   * element.
   * @param name
   */
  export let handleEndEdit = (name: string) => {};
  export let onMoreOptionsButtonClick = (event: MouseEvent) => {};
  export let inputElement: HTMLInputElement = null;
  /**
   * Additional classes for the node element
   */
  export let className: string = "";
  export let selected = false;
  export let editing = false;

  const dispatch = createEventDispatcher();
  let showMoreDropdownOpen = false;
  let showContextMenu = false;
  let resetNodeName = () => {};

  async function startEdit() {
    if (!editable) return;

    const currentName = label;
    resetNodeName = () => {
      label = currentName;
    };

    await tick();
    editing = true;

    setTimeout(() => {
      inputElement.focus();
      inputElement.select();
    });
  }

  function endEdit(abort = false) {
    if (!editing) return;

    // a callback is called with the latest value before reseting
    // the node name
    handleEndEdit(inputElement.value);

    if (abort && typeof resetNodeName === "function") {
      resetNodeName();
      resetNodeName = null;
    }

    editing = false;
  }

  async function submitChangeNodeName(name: string) {
    await handleEditNodeName(name);
    label = name;
    resetNodeName = null;
    endEdit();
  }

  function onInputKeydown(event: KeyboardEvent) {
    if (event.code === "Enter") {
      if (inputElement?.value) {
        submitChangeNodeName(inputElement?.value);
      } else {
        endEdit(true);
      }
    }
  }

  function handlePanelNodeClick(event: MouseEvent) {
    if (editing) {
      return;
    }

    if (
      event.target instanceof HTMLSpanElement &&
      event.target.classList.contains("panel-node-label-text")
    ) {
      dispatch("panel-node-click", { target: "label" });
    } else {
      dispatch("panel-node-click", { target: "node" });
    }
  }

  const moreButtonOptions: ContextMenuOptionsType = {
    menuItems: moreButtonItems,
    disabled: !moreButtonItems || moreButtonItems.length === 0,
    useClickEvent: true,
    onOpen: () => {
      showMoreDropdownOpen = true;
      contextMenuOptions.closeFromOutside?.();
    },
    onClose: () => {
      showMoreDropdownOpen = false;
    },
  };

  const contextMenuOptions: ContextMenuOptionsType = {
    menuItems: contextMenuItems,
    disabled: !contextMenuItems || contextMenuItems.length === 0,
    isAtMousePosition: true,
    onOpen: () => {
      showContextMenu = true;
      moreButtonOptions.closeFromOutside?.();
    },
    onClose: () => {
      showContextMenu = false;
    },
  };

  triggerEdit = () => {
    if (!editable) return;
    startEdit();
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="panel-node-element relative flex flex-row items-center px-2 py-1.5 rounded text-13px {className}"
  class:selected={selected ||
    showMoreDropdownOpen ||
    showContextMenu ||
    editing}
  class:editing
  use:contextMenuAction={contextMenuOptions}
  on:click={handlePanelNodeClick}
>
  <slot name="icon" />

  <div
    class="flex-grow flex-shrink outline-none pl-1.5 text-black"
    style="max-width: calc(100% - 44px);"
  >
    <div class="w-full relative">
      <div
        class="overflow-hidden whitespace-nowrap overflow-ellipsis panel-node-label"
        class:opacity-0={editing}
      >
        <span class="panel-node-label-text">
          {label}
        </span>
      </div>

      {#if editing}
        <div class="input-container absolute top-0 bottom-0 left-0 right-0">
          <input
            bind:this={inputElement}
            value={label}
            type="text"
            spellcheck="false"
            on:blur={() => endEdit(true)}
            on:keydown={onInputKeydown}
            class="w-full outline-none bg-transparent caret-primary-indigo-blue"
          />
        </div>
      {/if}
    </div>
  </div>

  {#if moreButtonItems?.length > 0}
    <div
      class="panel-more-button cursor-pointer ml-1 text-dark-100"
      class:opened={showMoreDropdownOpen}
      use:contextMenuAction={moreButtonOptions}
      on:click={onMoreOptionsButtonClick}
    >
      <Icon icon="panel-more" size="20px" />
    </div>
  {/if}
</div>

<style lang="postcss">
  .panel-node-element.selected,
  .panel-node-element:hover {
    @apply bg-primary-indigo-blue bg-opacity-10;
  }

  .panel-node-element:not(.selected) .panel-more-button {
    visibility: hidden;
  }

  .panel-node-element:hover .panel-more-button {
    visibility: visible !important;
  }

  .panel-more-button.opened,
  .panel-more-button:hover {
    @apply text-dark-300;
  }

  .panel-node-element.editing::after {
    @apply absolute top-0 bottom-0 left-0 right-0 pointer-events-none;
    @apply rounded border border-solid border-primary-indigo-blue;
    box-shadow: 1px 2px 6px 0px rgba(55, 84, 170, 0.16);
    content: "";
  }
</style>
