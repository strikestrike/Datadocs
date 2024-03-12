<script lang="ts">
  import { get } from "svelte/store";
  import { activeWorkbookStore, workbookListStore } from "../../../../../app/store/store-workbooks";
  import { keyControlAction } from "../../../../common/key-control/listKeyControl";
  import type {
    KeyControlConfig,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import FileWorkbookElement from "./FileWorkbookElement.svelte";

  const workbookList = get(workbookListStore);
  const activeWorkbook = get(activeWorkbookStore);
  let element: HTMLElement = null;

  const startDefaultIndex = 0;

  let configList: KeyControlConfig[] = [];
  let options: KeyControlActionOptions = {
    configList: configList,
  };
</script>

<div
  bind:this={element}
  class="default-dropdown-box-shadow h-[inherit] overflow-y-auto overflow-x-hidden bg-white rounded min-w-[300px] max-w-[300px]"
  use:keyControlAction={options}
>
  <div class="flex flex-col flex-nowrap py-1.5">
    {#each workbookList as workbook, index}
      <FileWorkbookElement
        {workbook}
        index={startDefaultIndex + index}
        keyControlActionOptions={options}
        scrollContainer={element}
        isActive={activeWorkbook?.id === workbook.id}
      />
    {/each}
  </div>
</div>
