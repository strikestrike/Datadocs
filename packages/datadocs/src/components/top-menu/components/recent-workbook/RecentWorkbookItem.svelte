<script lang="ts">
  import type { Workbook } from "../../../../app/store/types";
  import workbookIcon from "./workbook.svg?raw";

  export let workbook: Workbook;
</script>

<div
  class="flex flex-row items-center pl-3.5 pr-2 py-1.5 max-w-[300px] min-w-[240px] text-13px font-medium"
>
  <div class="pr-1">{@html workbookIcon}</div>

  <div
    class="flex-grow flex-shrink min-w-0 whitespace-nowrap overflow-hidden overflow-ellipsis text-dark-200"
  >
    {workbook.name}
  </div>
</div>
