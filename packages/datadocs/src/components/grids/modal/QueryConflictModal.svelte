<script lang="ts">
  import type { TableSpillBehavior } from "@datadocs/canvas-datagrid-ng";
  import { getContext, onMount, onDestroy } from "svelte";
  import Button from "../../common/form/Button.svelte";
  import Icon from "../../common/icons/Icon.svelte";
  import type {
    CloseModalFunctionType,
  } from "../../common/modal";

  import {
    CLOSE_MODAL_CONTEXT_NAME,
    ModalContentWrapper,
  } from "../../common/modal";

  const resolveStrategies: [TableSpillBehavior, string, string][] = [
    [
      "spill",
      "Spill",
      "The table will not fully display until it no longer spills.",
    ],
    [
      "moveToBottom",
      "Move To Bottom",
      "Create new rows to make space for the table.",
    ],
    [
      "moveToRight",
      "Move To Right",
      "Create new columns to make space for the table.",
    ],
    ["replace", "Replace", "Remove the data that the table will spill over."],
  ];

  export let onResolve: (strategy: TableSpillBehavior) => any;
  export let isMovable: boolean;

  let resolveStrategy: TableSpillBehavior = "spill";
  let closeModal: CloseModalFunctionType = getContext(CLOSE_MODAL_CONTEXT_NAME);
  let buttonsContainerElement: HTMLElement;

  function handleApplyButtonClick() {
    onResolve(resolveStrategy);
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
      handleApplyButtonClick();
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

<ModalContentWrapper title="Warning" {isMovable}>
  <div class="pt-8 pb-[30px] bg-white">
    <div class="w-full h-[60px] mb-5">
      <div class="w-[60px] h-[60px] m-auto">
        <Icon icon="workspace-modal-delete" size="60px" fill="none" />
      </div>
    </div>

    <div class="w-full mb-[30px] text-center text-13px font-medium">
      There are some data here. What would you like to do?
    </div>

    <div class="w-full text-10px mb-[30px]">
      <ul class="flex flex-col" style:align-items="center">
        {#each resolveStrategies as [strategy, name, description]}
          <li class="flex flex-row my-[auto] mb-2">
            <input
              class="mr-2"
              type="radio"
              id={strategy}
              bind:group={resolveStrategy}
              value={strategy}
            />
            <label for={strategy}> {name} - <i>{description}</i></label>
          </li>
        {/each}
      </ul>
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
        on:click={handleApplyButtonClick}>Apply</Button
      >
    </div>
  </div>
</ModalContentWrapper>
