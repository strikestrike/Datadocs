<script lang="ts">
  import { getContext, onDestroy, onMount, tick } from "svelte";
  import {
    ModalContentWrapper,
    CLOSE_MODAL_CONTEXT_NAME,
  } from "../../../../common/modal";
  import type { CloseModalFunctionType } from "../../../../common/modal";

  export let isMovable: boolean;

  const closeModal: CloseModalFunctionType = getContext(CLOSE_MODAL_CONTEXT_NAME);
  let inputElement: HTMLInputElement;
  let cancelButtonElement: HTMLElement;
  let saveButtonElement: HTMLElement;
  let shouldSelectNextFocus = true;

  function handleSaveButtonClick() {
    closeModal();
  }

  function handleCancelButtonClick() {
    closeModal();
  }

  function handleInputFocus() {
    if (shouldSelectNextFocus) {
      if (inputElement.value) {
        inputElement.select();
      }

      shouldSelectNextFocus = false;
    }
  }

  function handleInputBlur() {
    shouldSelectNextFocus = true;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== "Enter") {
      return;
    }

    const activeElement = document.activeElement;

    if (activeElement === inputElement) {
      handleSaveButtonClick();
      event.stopPropagation();
    } else if (activeElement === saveButtonElement) {
      handleSaveButtonClick();
      event.stopPropagation();
    } else if (activeElement === cancelButtonElement) {
      handleCancelButtonClick();
      event.stopPropagation();
    }
  }

  function handleWindowKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      handleSaveButtonClick();
    }
  }

  onMount(async () => {
    window.addEventListener("keydown", handleWindowKeyDown);

    await tick();
    inputElement.focus();
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleWindowKeyDown);
  });
</script>

<ModalContentWrapper title="Share" {isMovable}>
  <div class="px-[30px] pt-[22px] pb-5 bg-white">
    <div class="text-[#A7B0B5] text-10px font-semibold mb-1.5 uppercase">
      Share
    </div>

    <div class="w-full mb-5">
      <input
        bind:this={inputElement}
        class="focusable w-full h-[33px] px-3 py-2 m-0 text-11px font-medium"
        type="text"
        spellcheck="false"
        tabindex={0}
        on:focus={handleInputFocus}
        on:blur={handleInputBlur}
        on:keydown={handleKeyDown}
      />
    </div>

    <div class="h-9 flex flex-row justify-between items-center">
      <div class="mr-1 font-light text-[#A7B0B5] text-10px italic">
        Share this document.
      </div>

      <div class="h-9 flex flex-row text-13px font-medium">
        <div
          bind:this={cancelButtonElement}
          class="focusable button cancel-btn"
          on:click={handleCancelButtonClick}
          on:keydown={handleKeyDown}
          tabindex={0}
        >
          <div class="h-5 text-center">Cancel</div>
        </div>

        <div
          bind:this={saveButtonElement}
          class="focusable button save-btn ml-2.5"
          on:click={handleSaveButtonClick}
          on:keydown={handleKeyDown}
          tabindex={0}
        >
          <div class="h-5 text-center">Save</div>
        </div>
      </div>
    </div>
  </div>
</ModalContentWrapper>

<style lang="postcss">
  input {
    @apply rounded;
    border: 1px solid #e9edf0;
    box-sizing: border-box;
    outline: none;
  }

  .button {
    @apply py-2 rounded w-[84px] border-0 cursor-pointer;
  }

  .button :global(*) {
    @apply select-none;
  }

  .cancel-btn {
    @apply secondary-button;
  }

  .cancel-btn:hover {
    @apply secondary-button-hover;
  }

  .save-btn {
    @apply primary-button;
  }

  .save-btn:hover {
    @apply primary-button-hover;
  }
</style>
