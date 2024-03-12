<script lang="ts">
  import type { ObjectType } from "src/layout/types/object";
  import { Drag } from "src/layout/components/DragDrop";
  import { DND } from "src/layout/enums/dnd";
  import clsx from "clsx";
  import {
    APP_EVENT_LAYOUT_RESIZE_END,
    APP_EVENT_LAYOUT_RESIZE_START,
  } from "../../../app/core/global/app-manager-events";
  import { appManager } from "../../../app/core/global/app-manager";
  import Icon from "src/components/common/icons/Icon.svelte";
  import { PaneType } from "src/layout/enums/pane";
  import { objectHoverStatus } from "src/layout/store/object";
  import { useLayoutSheet } from "src/layout/store/pane";
  import { useTab } from "src/layout/components/Container/src/ContainerTab/useTab";
  import { ContextType } from "src/layout/enums/context";
  import { appDnd } from "src/app/core/global/app-dnd";
  import { useObject } from "src/layout/store/object/useObject";
  import { onMount, setContext } from "svelte";
  import { CONTEXT_TYPE } from "src/layout/constants/context";

  export let object: ObjectType;
  export let className: string = "";

  setContext(CONTEXT_TYPE, ContextType.SHEET);

  let element: HTMLElement;

  let isLayoutResizing = false;

  const {
    activePaneId,
    sync,
    isTabsGroup,
    getParentById,
    getById,
    isSpreadSheetGroup,
    isFixedGroup,
    insert,
    getRootId,
  } = useLayoutSheet();

  const { createPanefromObject } = useObject();

  const { addTab } = useTab();

  function updateDnd(object: ObjectType) {
    const pane = createPane();
    appDnd.update((val) => {
      return {
        ...val,
        action: DND.INSERT_OBJECT,
        data: {
          ...val.data,
          pane,
        },
        allowDrop: ContextType.SHEET,
      };
    });
  }

  function createPane() {
    return createPanefromObject({
      object,
      targetId: getRootId(),
      params: {
        x: 0,
        y: 0,
        width: 400,
        height: 300,
      },
    });
  }

  function getPhantom() {
    const newElement = element.cloneNode(true) as HTMLElement;
    newElement.classList.add("dragged");
    return newElement;
  }

  function onClick() {
    const pane = createPane();
    const activePane = getById($activePaneId);
    const parent = getParentById($activePaneId);
    if (activePane.type === PaneType.PANE) {
      addTab({
        targetId: isTabsGroup(parent) ? parent?.id : $activePaneId,
        pane,
      });
    } else {
      if (isTabsGroup(activePane)) {
        addTab({
          targetId: $activePaneId,
          pane,
        });
      }
      if (isSpreadSheetGroup(activePane) || isFixedGroup(activePane)) {
        insert({
          targetId: $activePaneId,
          newPane: pane,
        });
      }
    }
    sync();
  }

  function onMouseEnter() {
    // $objectHoverStatus = true;
  }

  function onMouseLeave() {
    // $objectHoverStatus = false;
  }

  function setupAppManager() {
    appManager.listen(APP_EVENT_LAYOUT_RESIZE_START, (eventData) => {
      isLayoutResizing = true;
    });
    appManager.listen(APP_EVENT_LAYOUT_RESIZE_END, (eventData) => {
      isLayoutResizing = false;
    });
  }

  onMount(() => {
    setupAppManager();
  });

</script>

<Drag on:dragstart={() => updateDnd(object)} phantom={getPhantom}>
  <div
    bind:this={element}
    class={clsx(
      "object-item", 
      { "pointer-events-none": isLayoutResizing },
      object.type, 
      className
    )}
    on:mouseup={onClick}
    on:keypress
    on:mouseenter={onMouseEnter}
    on:mouseleave={onMouseLeave}
  >
    <div class="object-item-icon">
      <Icon icon={object.icon} size="25" />
    </div>
    <div class="object-item-label">
      <caption>{object.label}</caption>
    </div>
  </div>
</Drag>

<style lang="postcss">
  .object-item {
    @apply flex flex-col justify-center items-center m-1 p-1 rounded-sm cursor-pointer text-gray-500 border border-[#F7F9FA] bg-white;
    width: 65px;
    height: 65px;
    .object-item-icon {
      @apply m-1 pointer-events-none;
    }
    .object-item-label {
      @apply text-[9px] leading-[14px] font-medium text-[#454450] my-1 pointer-events-none;
    }
    &.dragged {
      box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.16);
      /* opacity: 0.25; */
      :global(.object-item-icon svg path) {
        fill: #528bff;
      }
    }
  }
</style>
