<script lang="ts">
  import { getContext, onMount } from "svelte";
  import Icon from "../../icons/Icon.svelte";
  import PanelNodeElement from "../../panel/PanelNodeElement.svelte";
  import type { FlatFileSystemActions } from "./flatFileSystemActions";
  import { FILE_SYSTEM_ACTION_CONTEXT } from "./constant";
  import type { DataNodeBase } from "../fileSystemStateManager";
  import CircularSpinner from "../../spinner/CircularSpinner.svelte";

  export let label: string;
  export let parentId: string;
  export let type: string;

  const fileSystemActions: FlatFileSystemActions<DataNodeBase> = getContext(
    FILE_SYSTEM_ACTION_CONTEXT,
  );
  let triggerEdit: () => void;
  let inputElement: HTMLInputElement;
  /** True if the adding node process is running */
  let addingNode = false;

  async function handleEndEdit(name: string) {
    try {
      addingNode = true;
      await fileSystemActions.addNewNode(name, type, parentId);
    } finally {
      addingNode = false;
      fileSystemActions.removeNewNodePlaceholder();
    }
  }

  function getIcon(type: string) {
    switch (type) {
      case "folder":
      case "fd": {
        return "panel-folder";
      }
      case "workbook":
      case "wb": {
        return "panel-file";
      }
      default: {
        return "panel-folder";
      }
    }
  }

  onMount(() => {
    if (typeof triggerEdit === "function") {
      triggerEdit();
    }
  });
</script>

<div class="relative" class:adding-node={addingNode}>
  <PanelNodeElement
    bind:inputElement
    bind:triggerEdit
    {label}
    moreButtonItems={[]}
    {handleEndEdit}
  >
    <div slot="icon">
      <Icon icon={getIcon(type)} size="20px" />
    </div>
  </PanelNodeElement>

  {#if addingNode}
    <div class="loading-indicator">
      <CircularSpinner size={20} />
    </div>
  {/if}
</div>

<style lang="postcss">
  .adding-node {
    @apply bg-primary-indigo-blue bg-opacity-10;
  }

  .adding-node::after {
    @apply absolute top-0 bottom-0 left-0 right-0 pointer-events-none;
    @apply rounded border border-solid border-primary-indigo-blue;
    box-shadow: 1px 2px 6px 0px rgba(55, 84, 170, 0.16);
    content: "";
  }

  .loading-indicator {
    @apply absolute right-0 top-0 bottom-0 pr-2 flex flex-row items-center;

    :global(*) {
      @apply !fill-primary-indigo-blue;
    }
  }
</style>
