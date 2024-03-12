<script lang="ts">
  import Icon from "../../common/icons/Icon.svelte";
  import { addNewSheet } from "./utils";
  import { tick } from "svelte";

  export let scrollActiveSheetIntoview: () => void;

  async function handleAddNewSheet() {
    addNewSheet();
    await tick();
    scrollActiveSheetIntoview();
  }
</script>

<div
  class="w-5 h-4 pl-1 flex flex-row items-center justify-center flex-grow-0 cursor-pointer"
  on:click={handleAddNewSheet}
>
  <Icon icon="status-bar-add-tab" size="12px" />
</div>
