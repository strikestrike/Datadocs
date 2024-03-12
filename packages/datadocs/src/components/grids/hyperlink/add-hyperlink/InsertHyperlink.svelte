<script lang="ts">
  import TextInput from "./TextInput.svelte";
  import Button from "../../../common/form/Button.svelte";
  import { getContext } from "svelte";
  import { CLOSE_LAYOVER_MENU_CONTEXT } from "../../layover-menus/constant";
  import type { MetaRun } from "@datadocs/canvas-datagrid-ng";
  import { getGrid } from "../../../../app/store/grid/base";

  export let linkRun: MetaRun;

  const closeDropdownMenu: () => {} = getContext(CLOSE_LAYOVER_MENU_CONTEXT);

  let linkLabel = linkRun.label;
  let linkUrl = linkRun.ref ?? "";
  let labelInput: HTMLInputElement;

  function apply() {
    if (!linkUrl) {
      return;
    }
    getGrid().insertLink({ ...linkRun }, linkLabel, linkUrl);
    closeDropdownMenu();
  }

  function cancel() {
    closeDropdownMenu();
  }

  $: if (labelInput) {
    labelInput.focus();
  }
</script>

<div class="px-3.5 pt-2.5 pb-3.5">
  <form on:submit|preventDefault={apply}>
    <div class="space-y-3.5">
      <div class="uppercase text-11px text-dark-50 font-medium">
        Insert link
      </div>

      <TextInput title="Label" bind:value={linkLabel} />

      <TextInput
        bind:inputElement={labelInput}
        title="URL"
        bind:value={linkUrl}
      />

      <div
        class="control-buttons flex flex-row items-center gap-1.5 justify-end"
      >
        <Button type="button" color="secondary" on:click={cancel}>
          Cancel
        </Button>

        <Button type="submit">Apply</Button>
      </div>
    </div>
  </form>
</div>

<style lang="postcss">
  .control-buttons :global(button) {
    @apply h-7 py-1 px-3 text-12px;
  }

  .control-buttons :global(button:focus) {
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }
</style>
