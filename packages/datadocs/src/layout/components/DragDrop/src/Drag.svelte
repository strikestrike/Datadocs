<script lang="ts">
  import { createEventDispatcher, getContext } from "svelte";
  import {
    phantom as storePhantom,
    phantomGlobal as storePhantomGlobal,
  } from "./phantom";
  import { useLayoutSheet, useLayoutWorkBook } from "src/layout/store/pane";
  import { appDnd } from "src/app/core/global/app-dnd";
  import type { Type } from "src/layout/types/context";
  import { CONTEXT_TYPE } from "src/layout/constants/context";
  import { ContextType } from "src/layout/enums/context";
  import { useListener } from "./listener";

  export let phantom:
    | HTMLElement
    | null
    | ((event: MouseEvent) => HTMLElement) = null;

  const type = getContext<Type>(CONTEXT_TYPE);

  const emit = createEventDispatcher<{
    dragstart: {
      event: MouseEvent;
      drawPhantom: (event: MouseEvent) => void;
    };
    documentOver: MouseEvent;
    documentEnd: MouseEvent;
    documentOverFirst: MouseEvent;
  }>();

  let rootElement: HTMLElement | null = null;
  let phantomElement: HTMLElement | null = null;
  let firstMove = false;

  const { reset } =
    type === ContextType.SHEET ? useLayoutSheet() : useLayoutWorkBook();

  const { addListener, removeListener } = useListener({
    onMouseMove,
    onMouseUp,
    onWindowMouseUp,
  });

  appDnd.subscribe((val) => {
    if (!val) {
      removeListener();
    }
  });

  function drawPhantom(event: MouseEvent) {
    $storePhantom = $storePhantomGlobal.cloneNode(true) as HTMLElement;
    if ($appDnd) {
      const { offsetLeft, offsetTop } = $appDnd?.data;
      $storePhantom.style.top = `${event.clientY - offsetTop}px`;
      $storePhantom.style.left = `${event.clientX - offsetLeft}px`;
    }
    return $storePhantom;
  }

  function onMouseDown(event: MouseEvent) {
    // only trigger with left click
    if (event.button !== 0) return;
    const elementBounds = rootElement.getBoundingClientRect();
    const offset = {
      offsetLeft: event.clientX - elementBounds.left,
      offsetRight: elementBounds.right - event.clientX,
      offsetTop: event.clientY - elementBounds.top,
      offsetBottom: elementBounds.bottom - event.clientY,
    };
    appDnd.update((val) => {
      return {
        ...val,
        event,
        data: {
          ...offset,
        },
        allowDrop: type,
      };
    });
    $storePhantomGlobal = createPhantom(event);
    addListener();
    emit("dragstart", { event, drawPhantom });
  }

  function onMouseMove(event: MouseEvent) {
    if (!firstMove) {
      firstMove = true;
      emit("documentOverFirst", event);
    }
    if ($appDnd) {
      drawPhantom(event);
      appDnd.update((val) => {
        return {
          ...val,
          event,
        };
      });
      emit("documentOver", event);
    }
  }

  function onMouseUp(event: MouseEvent) {
    emit("documentEnd", event);
  }

  function onWindowMouseUp() {
    console.log("reset");
    appDnd.set(null);
    $storePhantom = null;
    reset();
  }

  function createPhantom(event: MouseEvent) {
    let pt: HTMLElement | null = rootElement.cloneNode(true) as HTMLElement;
    if (phantom) {
      if (typeof phantom === "function") {
        pt = phantom(event);
      } else if (phantom instanceof HTMLElement) {
        pt = phantom;
      }
    } else if (phantomElement) {
      pt = phantomElement.children[0] as HTMLElement;
    }
    pt.classList.add("opacity-25");
    return pt;
  }

  $: {
  }
</script>

<div bind:this={rootElement} on:mousedown|stopPropagation={onMouseDown}>
  <slot />
  {#if $$slots.phantom}
    <div bind:this={phantomElement} class="hidden">
      <slot name="phantom" />
    </div>
  {/if}
</div>
