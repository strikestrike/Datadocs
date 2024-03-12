<script lang="ts">
  import { getContext } from "svelte";
  import type { PointerPosition } from "../../../../../layout/helpers/drag-action/types";
  import Icon from "../../../../common/icons/Icon.svelte";
  import ToolbarSeparator from "../../ToolbarSeparator.svelte";
  import {
    MIME_TYPE_APP_TOOLBAR_DND,
    MIME_TYPE_APP_TOOLBAR_DND_UNDOCKABLE,
    TRIGGER_TOOLBAR_UPDATE_CONTEXT_NAME,
  } from "../ToolbarBase";
  import type { ToolbarSectionSubtoolbar } from "../type";

  const undockedSubtoolbar = getContext(
    TRIGGER_TOOLBAR_UPDATE_CONTEXT_NAME
  ) as () => any;

  const dragContext = {
    started: false,
    initialized: false,
    offset: { x: 0, y: 0 } as PointerPosition,
  };

  export let sectionStatus: Record<string, boolean>;
  export let section: ToolbarSectionSubtoolbar;
  export let hiddenSection = false;

  let sectionElement: HTMLElement;
  let dragElement: HTMLElement;
  let canDrag = true;

  $: dragging = dragContext.started && dragContext.initialized;
  $: undocked = section.meta?.undocked ?? false;
  $: position = section.meta?.undockedPosition ?? { x: 0, y: 0 };
  $: hasVisible =
    section.sections.findIndex(
      (subsection) => sectionStatus[subsection.name]
    ) !== -1;

  $: if (section.alwaysFloating && !section.meta?.undocked && sectionElement) {
    if (section.meta) {
      section.meta.undocked = true;
    } else {
      const undockedPosition = section.alwaysFloating.getInitialPosition(
        sectionElement.getBoundingClientRect()
      );
      section.meta = {
        undocked: true,
        undockedPosition,
      };
    }
  }

  function onDragStart(e: DragEvent) {
    if (
      hiddenSection ||
      !canDrag ||
      (e.target !== sectionElement && e.target !== dragElement)
    ) {
      return;
    }
    if (!undocked) {
      const rect = sectionElement.getBoundingClientRect();
      section.meta = {
        undocked: true,
        undockedPosition: {
          x: rect.left,
          y: rect.top,
        },
      };
    }

    const { undockedPosition: pos } = section.meta;
    dragContext.started = true;
    dragContext.offset.x = e.clientX - pos.x;
    dragContext.offset.y = e.clientY - pos.y;
    dragContext.initialized = false;

    e.dataTransfer.dropEffect = "move";
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(MIME_TYPE_APP_TOOLBAR_DND, section.name);
    if (section.alwaysFloating) {
      e.dataTransfer.setData(
        MIME_TYPE_APP_TOOLBAR_DND_UNDOCKABLE,
        section.name
      );
    }

    // Don't remove the ghost image for WebKit-compatibility.
    if (e.target != dragElement) {
      const rect = dragElement.getBoundingClientRect();
      e.dataTransfer.setDragImage(
        dragElement,
        e.clientX - rect.left,
        e.clientY - rect.top
      );
    }

    undockedSubtoolbar();
  }

  function onDrag() {
    if (!dragContext.started) return;
    dragContext.initialized = true;
  }

  function onDragEnd() {
    if (!dragContext.started) return;
    dragContext.started = false;
  }

  function onDragOverWindow(e: DragEvent) {
    if (!dragContext.started) return;
    const { offset } = dragContext;
    section.meta.undockedPosition = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    };
  }

  function onPointerMove(e: Event) {
    canDrag = !(e.target instanceof Element) || isTargetDraggable(e.target);
  }

  function isTargetDraggable(target: Element | undefined) {
    return (
      target === sectionElement ||
      !(target instanceof HTMLElement || target instanceof SVGElement) ||
      (isDraggable(target) && isTargetDraggable(target.parentElement))
    );
  }

  function isDraggable(target: HTMLOrSVGElement) {
    return !target.dataset.ddSubtoolbarNoDraggable;
  }
</script>

<!-- Workaround for: https://bugzilla.mozilla.org/show_bug.cgi?id=505521#c80 -->
<svelte:window on:dragover={onDragOverWindow} />

{#if hiddenSection}
  {#each section.sections as subsection}
    {#if !sectionStatus[subsection.name] && !section.hidden}
      <svelte:component this={subsection.component} />
    {/if}
  {/each}
{:else if hasVisible || undocked}
  <div
    bind:this={sectionElement}
    class="subtoolbar-container"
    class:undocked
    class:dragging
    style:top="{position.y}px"
    style:left="{position.x}px"
    draggable={canDrag}
    on:pointermove={onPointerMove}
    on:dragstart={onDragStart}
    on:drag={onDrag}
    on:dragend={onDragEnd}
  >
    <button
      bind:this={dragElement}
      class="subtoolbar-drag-button"
      draggable="true"
      class:hide-button={!undocked}
    >
      <Icon icon="drag" width="8px" />
    </button>
    {#each section.sections as subsection, i}
      {#if (undocked || sectionStatus[subsection.name]) && !subsection.hidden && (!subsection.visibility || undocked === (subsection.visibility === "when-undocked"))}
        {#if undocked && i > 0}
          <div class="subtoolbar-divider" />
        {/if}
        <div class="subtoolbar-component">
          <svelte:component this={subsection.component} />
        </div>
        {#if !undocked}
          <ToolbarSeparator />
        {/if}
      {/if}
    {/each}
  </div>
{/if}

<style lang="postcss">
  .subtoolbar-container {
    @apply flex flex-row items-center;

    &.undocked {
      @apply rounded bg-white fixed z-2000 pr-2 items-stretch border border-light-100;
      box-shadow: 0px 5px 20px 0px rgba(55, 84, 170, 0.16);
    }

    &.dragging {
      @apply pointer-events-none;
    }

    .subtoolbar-component {
      @apply flex flex-row py-0.5 items-center;
    }

    .subtoolbar-divider {
      @apply mx-2 w-1px border-r border-separator-line-color;
    }

    .subtoolbar-drag-button {
      @apply ml-1.5 mr-1 cursor-move text-dark-50 outline-none;

      &.hide-button {
        display: none;
      }

      &:hover,
      &:focus-visible {
        @apply text-dark-100;
      }
    }
  }
</style>
