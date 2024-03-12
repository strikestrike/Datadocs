<script lang="ts">
  import Button from "../../../../common/form/Button.svelte";
  import openIcon from "./open.svg?raw";
  import { openWorkbook } from "../utils";

  export let objectId: string;
</script>

<Button
  class="w-full flex flex-row items-center py-1.5 text-13px font-medium"
  color="primary-accent"
  on:click={() => {
    openWorkbook(objectId, true);
  }}
>
  <div class="flex flex-row h-5 items-center gap-1">
    <div>{@html openIcon}</div>
    <div>Open</div>
  </div>
</Button>
