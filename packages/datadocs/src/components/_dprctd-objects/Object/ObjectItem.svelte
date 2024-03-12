<script lang="ts">
  import ObjectChart from "../ObjectChart/ObjectChart.svelte";
  import ObjectImage from "../ObjectImage/ObjectImage.svelte";
  import ObjectSlicer from "../ObjectSlicer/ObjectSlicer.svelte";

  import { dragDrop } from "../../../actions/drag-drop/drag-drop";
  import type { DragInfo } from "../../../actions/drag-drop/drag-drop-types";
  import type { ViewObject } from "../../../app/core/objects/objects-types";
  import {
    OBJECT_TYPE_CONTAINER,
    OBJECT_TYPE_CHART,
    OBJECT_TYPE_IMAGE,
    OBJECT_TYPE_SPREADSHEET,
  } from "../../../app/core/objects/objects-constants";

  let objectElement: HTMLElement;

  export let objectData: ViewObject = null;

  export let index = -1;

  export let onObjectChange = (gridObject) => {};

  function onDragEnd(dragInfo: DragInfo, isAfter: boolean) {
    if (isAfter) {
      objectData.transform.x += dragInfo.changeX;
      objectData.transform.y += dragInfo.changeY;
      onObjectChange(objectData);
    }
  }

  // function dragHandler(element) {
  //   let drag = {
  //     startX: 0,
  //     startY: 0,
  //     offX: 0,
  //     offY: 0,
  //     x: 0,
  //     y: 0,
  //   };

  //   function onMouseDown(event) {
  //     event.stopPropagation();
  //     window.addEventListener("mousemove", onWindowMouseMove);
  //     window.addEventListener("mouseup", onWindowMouseUp);

  //     const bounds: DOMRect = element.getBoundingClientRect();

  //     drag.startX = event.clientX;
  //     drag.startY = event.clientY;

  //     drag.offX = event.clientX - bounds.left;
  //     drag.offY = event.clientY - bounds.top;

  //     drag.x = objectData.transform.x + (event.clientX - drag.startX);
  //     drag.y = objectData.transform.y + (event.clientY - drag.startY);
  //   }

  //   function onWindowMouseMove(event) {
  //     element.style.transform = `translateX(${
  //       event.clientX - drag.startX
  //     }px) translateY(${event.clientY - drag.startY}px)`;
  //     drag.x = objectData.transform.x + (event.clientX - drag.startX);
  //     drag.y = objectData.transform.y + (event.clientY - drag.startY);
  //   }

  //   function onWindowMouseUp() {
  //     objectData.transform.x = drag.x;
  //     objectData.transform.y = drag.y;
  //     onObjectChange(objectData);
  //     resetDrag();
  //   }

  //   function resetDrag() {
  //     drag = {
  //       startX: 0,
  //       startY: 0,
  //       offX: 0,
  //       offY: 0,
  //       x: 0,
  //       y: 0,
  //     };
  //     element.style.transform = "";
  //     window.removeEventListener("mousemove", onWindowMouseMove);
  //     window.removeEventListener("mouseup", onWindowMouseUp);
  //   }

  //   element.addEventListener("mousedown", onMouseDown);

  //   return {
  //     destroy() {
  //       resetDrag();
  //       element.removeEventListener("mousedown", onMouseDown);
  //     },
  //   };
  // }
</script>

<div
  class="object-item"
  style={`left:${objectData.transform?.x}px; top:${objectData.transform?.y}px; z-index: ${index}`}
  bind:this={objectElement}
  use:dragDrop={{
    useTranslate: true,
    onDragEnd,
  }}
>
  {#if objectData !== null}
    {#if objectData.type === OBJECT_TYPE_CHART}
      <ObjectChart {objectData} {onObjectChange} />
    {:else if objectData.type === OBJECT_TYPE_IMAGE}
      <ObjectImage {objectData} {onObjectChange} />
    {/if}
  {/if}
</div>

<style lang="postcss">
  .object-item {
    @apply absolute pointer-events-auto;
  }
</style>
