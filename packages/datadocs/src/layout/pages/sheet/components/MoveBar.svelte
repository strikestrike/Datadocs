<script lang="ts">
  import { appDnd } from "src/app/core/global/app-dnd";
  import Drag from "src/layout/components/DragDrop/src/Drag.svelte";
  import type { Pane } from "src/layout/types/pane";
  import Object from "src/components/panels/Objects/Object.svelte";
  import type { ObjectType } from "src/layout/types/object";
  import { useLayoutSheet } from "src/layout/store/pane";
  import { DND } from "src/layout/enums/dnd";

  export let pane: Pane = null;

  let show = false;

  const { removeById, getParentById, isHGroup, isVGroup } = useLayoutSheet();

  $: label = pane?.content?.view?.label || "";
  $: icon = pane?.content?.view?.icon || "";
  $: object = {
    type: "",
    label,
    icon,
  } as ObjectType;
  $: parent = getParentById(pane.id);

  $: {
    /**
     * When to show the move bar
     * 1. Pane is in main area
     * 2. Pane is not a group and has a sibling and its group is H/V Group
     */
    show =
      !!(isHGroup(parent) || isVGroup(parent)) && parent?.children?.length > 1;
  }

  function removeNested(targetPane: Pane) {
    removeById(targetPane.id);
  }

  function onDragStart(event) {
    appDnd.update((val) => {
      return {
        ...val,
        action: DND.INSERT_OBJECT,
        data: {
          ...val.data,
          pane: { ...pane },
        },
      };
    });

    removeNested(pane);
  }

  $: {
    // console.log(pane, show);
  }
</script>

{#if show}
  <div class="move-bar">
    <Drag on:dragstart={onDragStart}>
      <div class="w-8 h-3 flex justify-around px-1 items-center">
        <div class="move-bar-circle" />
        <div class="move-bar-circle" />
        <div class="move-bar-circle" />
      </div>
      <Object slot="phantom" {object} />
    </Drag>
  </div>
{/if}

<style lang="postcss">
  .move-bar {
    @apply absolute w-8 h-3 top-0 left-1/2 cursor-move bg-gray-600 transform -translate-x-1/2 z-300 rounded-b-sm text-white pointer-events-auto;
    box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.2);
    .move-bar-circle {
      @apply w-1 h-1 box-border border border-solid bg-white transform z-200 rounded pointer-events-none;
    }
  }
</style>
