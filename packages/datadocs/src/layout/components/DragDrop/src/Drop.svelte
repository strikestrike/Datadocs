<script lang="ts">
  import { createEventDispatcher, getContext } from "svelte";
  import {
    phantom as storePhantom,
    phantomGlobal as storePhantomGlobal,
  } from "./phantom";
  import { getId } from "src/layout/utils/data";
  import { useLayoutSheet, useLayoutWorkBook } from "src/layout/store/pane";
  import { appDnd } from "src/app/core/global/app-dnd";
  import type { Type } from "src/layout/types/context";
  import { CONTEXT_TYPE } from "src/layout/constants/context";
  import { ContextType } from "src/layout/enums/context";

  export let phantom:
    | HTMLElement
    | null
    | ((event: MouseEvent) => HTMLElement | "none")
    | "none"
    | "slot" = "slot";

  export let zIndex = 0;

  const type = getContext<Type>(CONTEXT_TYPE);

  const emit =
    createEventDispatcher<
      Record<"dragover" | "drop" | "dragin" | "dragout", MouseEvent>
    >();
  const id = getId();
  const { sync } =
    type === ContextType.SHEET ? useLayoutSheet() : useLayoutWorkBook();

  let phantomElement: HTMLElement | null = null;

  let isOver = false;
  $: isDND = !!$appDnd;
  $: allowDrop = $appDnd?.allowDrop === type;

  function onMouseUp(event: MouseEvent) {
    if (isDND) {
      $storePhantom = null;
      emit("drop", event);
      sync();
      appDnd.set(null);
      event.stopPropagation();
    }
  }

  function onMouseMove(event: MouseEvent) {
    console.log("drop mouse move");
    if (isDND) {
      const pt = createPhantom(event);
      if (pt !== "none") {
        $storePhantom = pt;
        const { data } = $appDnd;
        const { offsetLeft, offsetTop } = data;
        $storePhantom.style.top = `${event.clientY - offsetTop}px`;
        $storePhantom.style.left = `${event.clientX - offsetLeft}px`;
      } else {
        $storePhantom = null;
      }

      event.stopPropagation();

      appDnd.update((val) => {
        return {
          ...val,
          event,
        };
      });
      emit("dragover", event);
    }
  }

  function createPhantom(event: MouseEvent) {
    let pt: HTMLElement | "none" = $storePhantomGlobal.cloneNode(
      true,
    ) as HTMLElement;
    pt.classList.remove("opacity-25");
    if (phantom) {
      if (typeof phantom === "function") {
        pt = phantom(event);
      } else if (phantom instanceof HTMLElement) {
        pt = phantom;
      } else if (phantom === "none") {
        pt = "none";
      } else if (phantom === "slot" && phantomElement) {
        pt = phantomElement.children[0] as HTMLElement;
      }
    }

    if (pt !== "none") {
      pt.id = id;
    }
    return pt;
  }

  function onMouseEnter(event: MouseEvent) {
    if (isDND) {
      isOver = true;
      emit("dragin", event);
    }
  }

  function onMouseLeave() {
    if (isDND) {
      isOver = false;
      emit("dragout");
    }
  }

  $: {
    // console.log($appDnd, isDND, allowDrop, $appDnd?.action, allowAction);
  }
</script>

{#if isDND && allowDrop}
  <div
    on:mouseup={onMouseUp}
    on:mousemove={onMouseMove}
    on:mouseenter={onMouseEnter}
    on:mouseleave={onMouseLeave}
    style:z-index={zIndex}
    class=""
  >
    <slot />
    {#if $$slots.phantom && isDND && isOver}
      <div bind:this={phantomElement} class="hidden">
        <slot name="phantom" />
      </div>
    {/if}
  </div>
{/if}
