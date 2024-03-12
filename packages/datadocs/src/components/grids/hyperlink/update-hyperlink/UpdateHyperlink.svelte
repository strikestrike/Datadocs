<script lang="ts">
  import { onMount } from "svelte";
  import type { MetaRun } from "@datadocs/canvas-datagrid-ng";
  import Input from "./Input.svelte";
  import Button from "../../../common/form/Button.svelte";
  import { applyLinkRunChange, updateFormulaPreview } from "../../../../app/store/store-toolbar";
  import { getGrid } from "../../../../app/store/grid/base";

  export let linkRun: MetaRun;
  export let value: string;
  /**
   * Whether the menu is for formula cell auto-generated link or not
   */
  export let isFormulaCellHyperlink = false;

  let labelInputElement: HTMLInputElement;
  let linkLabel = linkRun.label;
  let linkRef = linkRun.ref;

  function applyChange() {
    if (!linkRef) return;

    if (!isFormulaCellHyperlink) {
      applyLinkRunChange(linkRun, linkLabel, linkRef);
    } else {
      getGrid().changeFormulaLinkRun(linkLabel, linkRef);
      updateFormulaPreview();
    }
  }

  onMount(() => {
    // select label input on opening the layover menu
    if (labelInputElement) {
      labelInputElement.focus();
      labelInputElement.select();
    }
  });
</script>

<div class="py-3 px-1">
  <form on:submit|preventDefault={applyChange}>
    <div>
      <Input
        bind:inputElement={labelInputElement}
        bind:value={linkLabel}
        label="Text"
      />
    </div>

    <div class="mt-4 flex flex-row items-end gap-3">
      <div>
        <Input bind:value={linkRef} label="Reference" />
      </div>

      <div class="apply-button">
        <Button type="submit">Apply</Button>
      </div>
    </div>
  </form>
</div>

<style lang="postcss">
  .apply-button :global(button) {
    @apply h-8 py-1 px-3 text-13px;
  }

  .apply-button :global(button:focus) {
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }
</style>
