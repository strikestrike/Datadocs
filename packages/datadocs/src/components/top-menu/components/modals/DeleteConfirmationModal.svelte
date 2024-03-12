<script lang="ts">
  import { getContext, onMount, onDestroy } from "svelte";
  import Icon from "../../../common/icons/Icon.svelte";
  import {
    ModalContentWrapper,
    CLOSE_MODAL_CONTEXT_NAME,
  } from "../../../common/modal";
  import type { CloseModalFunctionType } from "../../../common/modal";
  import Button from "../../../common/form/Button.svelte";

  export let mainMessage: string;
  export let sideMessages: string[] = [];
  export let executeOnYes: () => Promise<any>;
  export let title: string;
  export let isMovable: boolean;

  const closeModal: CloseModalFunctionType = getContext(CLOSE_MODAL_CONTEXT_NAME);
  let buttonsContainerElement: HTMLElement;

  async function handleDeleteButtonClick() {
    try {
      await executeOnYes();
    } catch (error) {
      console.log("Error: ", error);
    }
    closeModal();
  }

  function handleCancelButtonClick() {
    closeModal();
  }

  function handleWindowKeyDown(event: KeyboardEvent) {
    const activeElement = document.activeElement;
    if (
      event.key === "Enter" &&
      (!activeElement || !buttonsContainerElement.contains(activeElement))
    ) {
      handleDeleteButtonClick();
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleWindowKeyDown);
    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleWindowKeyDown);
  });
</script>

<ModalContentWrapper {title} {isMovable}>
  <div class="pt-8 pb-[30px] bg-white">
    <div class="w-full h-[60px] mb-5">
      <div class="w-[60px] h-[60px] m-auto">
        <Icon icon="workspace-modal-delete" size="60px" fill="none" />
      </div>
    </div>

    <div class="w-full mb-2 text-center text-13px font-medium">
      {mainMessage}
    </div>

    <div
      class="w-full text-center text-10px text-[#A7B0B5] font-light italic mb-[30px]"
    >
      {#each sideMessages as ms}
        <p>{ms}</p>
      {/each}
      <!-- <p>Please be 100% sure about your decision as you will no longer be</p>
      <p>able to recover this workspace after deleting it.</p> -->
    </div>

    <div
      bind:this={buttonsContainerElement}
      class="w-full flex flex-row justify-center space-x-2.5"
    >
      <Button
        class="focusable w-[84px]"
        color="secondary"
        type="button"
        on:click={handleCancelButtonClick}>Cancel</Button
      >
      <Button
        class="focusable w-[84px]"
        color="warn"
        on:click={handleDeleteButtonClick}>Delete</Button
      >
    </div>
  </div>
</ModalContentWrapper>

<style lang="postcss">
</style>
