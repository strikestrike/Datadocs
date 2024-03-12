<script lang="ts">
  import { getContext } from "svelte";
  import type {
    CloseModalFunctionType,
    MoveModalActionType} from "./type";
  import {
    CLOSE_MODAL_CONTEXT_NAME,
    MOVE_MODAL_ACTION_CONTEXT_NAME
  } from "./type";
  import Icon from "../icons/Icon.svelte";
  import modalFocusTrapAction from "./modalFocusTrapAction";

  export let title: string;
  export let hasHeader = true;
  export let isMovable: boolean;

  const closeModal: CloseModalFunctionType = getContext(
    CLOSE_MODAL_CONTEXT_NAME
  );
  const moveModalAction: MoveModalActionType = getContext(
    MOVE_MODAL_ACTION_CONTEXT_NAME
  );

  function onCloseButtonClick() {
    closeModal();
  }
</script>

<div
  class="bg-white w-full h-full default-dropdown-box-shadow rounded overflow-hidden"
  use:modalFocusTrapAction={{ selector: ".focusable" }}
>
  {#if hasHeader}
    <div class="modal-header" class:movable={isMovable} use:moveModalAction>
      <div class="flex flex-row flex-nowrap justify-between items-center">
        <div
          class="modal-title h-5 font-semibold uppercase text-13px text-white"
        >
          <div
            class="max-w-[450px] whitespace-nowrap overflow-hidden overflow-ellipsis"
          >
            {title}
          </div>
        </div>

        <button
          class="focusable close-button ml-2 h-5 w-5 overflow-hidden cursor-pointer"
          tabindex={0}
          on:click={onCloseButtonClick}
        >
          <div
            class="relative h-5 w-5 flex flex-row items-center justify-items-center"
          >
            <div class="close-icon h-5 w-5">
              <Icon icon="workspace-modal-close" size="20px" />
            </div>
          </div>
        </button>
      </div>
    </div>
  {/if}

  <div class="relative">
    <slot />
  </div>
</div>

<style lang="postcss">
  .modal-header {
    @apply px-[30px] pt-3.5 pb-3 header-gradient-bg;
  }

  .modal-header.movable {
    @apply cursor-move;
  }

  .modal-header .close-button {
    @apply cursor-pointer;
  }

  .modal-header.movable :global(*) {
    /* user-select: none; */
    @apply pointer-events-none;
  }

  .modal-title {
    width: calc(100% - 28px);
  }

  .close-button {
    @apply rounded-full border-none pointer-events-auto overflow-hidden;
  }

  .close-button:active {
    @apply bg-transparent;
  }

  .close-button:hover {
    opacity: 0.6;
  }

  .modal-header.movable .close-button :global(*) {
    pointer-events: auto;
  }

  /* .close-icon {
    -webkit-transition: transform 200ms ease-in-out;
    -moz-transition: transform 200ms ease-in-out;
    -o-transition: transform 200ms ease-in-out;
    transition: transform 200ms ease-in-out;
  }

  .close-icon:hover {
    transform: scale(1.8, 1.8);
  } */
</style>
