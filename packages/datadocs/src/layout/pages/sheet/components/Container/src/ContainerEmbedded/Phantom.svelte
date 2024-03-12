<script lang="ts">
  import Object from "src/components/panels/Objects/Object.svelte";
  import type { ObjectType } from "src/layout/types/object";
  import type { Pane } from "src/layout/types/pane";

  export let pane: Pane = null;

  $: object = {
    type: "",
    label: pane?.content?.view?.label || "",
    icon: pane?.content?.view?.icon || "",
  } as ObjectType;
</script>

<Object {object} className="phatom-object" />

<style lang="postcss">
  :global(.phatom-object) {
    @apply !w-[300px] !h-[300px];
    box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.16);
    :global(svg) {
      @apply w-[100px] h-[100px];
    }
    :global(.object-item-label) {
      @apply hidden;
    }
    :global(.object-item-icon svg path) {
      fill: #528bff;
    }
  }
</style>
