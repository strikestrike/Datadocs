<script lang="ts">
  import type { CustomMenuItemType } from "./type";
  import Icon from "../../../common/icons/Icon.svelte";
  import { supportedItems } from "./constant";
  import UndoHint from "./hints/UndoHint.svelte";
  import RedoHint from "./hints/RedoHint.svelte";
  import CutHint from "./hints/CutHint.svelte";
  import CopyHint from "./hints/CopyHint.svelte";
  import PasteHint from "./hints/PasteHint.svelte";
  import Empty from "./hints/Empty.svelte";

  export let item: CustomMenuItemType;
  const labels: Record<CustomMenuItemType, string> = {
    undo: "Undo",
    redo: "Redo",
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    clear: "Clear",
    delete: "Delete",
  };
  const prefixIcons: Record<CustomMenuItemType, string> = {
    undo: "undo",
    redo: "redo",
    cut: "edit-cut",
    copy: "edit-copy",
    paste: "edit-paste",
    clear: "edit-clear",
    delete: "edit-delete",
  };

  function getRightPart() {
    switch (item) {
      case "undo": {
        return UndoHint;
      }
      case "redo": {
        return RedoHint;
      }
      case "cut": {
        return CutHint;
      }
      case "copy": {
        return CopyHint;
      }
      case "paste": {
        return PasteHint;
      }
      default: {
        return Empty;
      }
    }
  }
</script>

{#if supportedItems.includes(item)}
  <div class="w-full flex flex-row pl-3.5 pr-2 py-1.5 text-13px">
    <div
      class="flex-grow flex-shrink flex flex-row items-center font-medium leading-5 gap-1"
    >
      {#if prefixIcons[item]}
        <div><Icon icon={prefixIcons[item]} size="20px" /></div>
      {/if}
      <div class="flex-grow flex-shrink">
        {labels[item]}
      </div>
    </div>

    <div class="flex-grow-0 flex-shrink-0">
      <svelte:component this={getRightPart()} />
    </div>
  </div>
{/if}
