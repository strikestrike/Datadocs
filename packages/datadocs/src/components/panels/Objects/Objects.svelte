<script lang="ts">
  import { objectsList } from "./objects-list";
  import Object from "./Object.svelte";
  import type { Pane } from "src/layout/types/pane";

  export let pane: Pane = null;
</script>

<div class="panel-objects">
  <div class="objects-list">
    {#each objectsList as objectGroup}
      <div class="object-group">
        <div class="object-group-label">
          {objectGroup.label}
        </div>
        <div class="object-items">
          {#each objectGroup.objects as object, index}
            <Object {object} />
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style lang="postcss">
  .panel-objects {
    @apply flex flex-col h-full px-3.5 py-2;
  }

  .objects-list {
    @apply flex flex-col;
  }

  .object-group {
    @apply flex flex-col;
  }

  .object-group-label {
    @apply text-10px leading-[15px] font-semibold my-1 text-[#A7B0B5] uppercase;
  }

  .object-items {
    @apply flex flex-row flex-wrap justify-start relative;
  }
</style>
