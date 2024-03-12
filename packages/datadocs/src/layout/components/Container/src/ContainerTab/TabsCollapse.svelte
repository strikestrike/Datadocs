<script lang="ts">
  import Icon from "src/components/common/icons/Icon.svelte";
  import tooltipAction from "src/components/common/tooltip";
  import type { Pane } from "src/layout/types/pane";
  import { Drag, Drop } from "src/layout/components/DragDrop";
  import { appDnd } from "src/app/core/global/app-dnd";
  import { DND } from "src/layout/enums/dnd";
  import { useLayoutWorkBook } from "src/layout/store/pane";
  import { useTab } from "./useTab";
  import clsx from "clsx";
  import { contextMenuAction } from "src/components/common/context-menu";
  import {
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
  } from "src/components/common/menu";
  import { bind, openModal } from "src/components/common/modal";
  import { ContainerTabModal } from "src/layout/components/Container";
  import { Split } from "src/layout/enums/split";
  import type { TooltipPostionType } from "src/components/common/tooltip/type";

  export let pane: Pane;

  const {
    getById,
    removeById,
    moveTo,
    isVGroup,
    isCollapse,
    isCollaspeGroup,
    findLastParentDeepById,
    setCollapseById,
    sync,
    findAllChildNumDeepById,
    isPane,
    getParentById,
    isHGroup,
    isDashboard,
    findFirstChildDeepById,
    findPositionById,
  } = useLayoutWorkBook();
  const { addTab } = useTab();

  let elementIndicators = null;
  let elementDrag = null;
  let previewPosition = "";
  let isDragOverTop = false;
  let childrenBounds: Record<Pane["id"], DOMRect> = {};
  let direction = Split.EAST;
  let tooltipDirection: TooltipPostionType = "left";

  $: children = pane?.children || [];
  $: dragId = $appDnd?.data?.pane?.id || "";
  $: dragPane = $appDnd?.data?.pane;
  $: dragView = $appDnd?.data?.pane?.content?.view || {};

  $: topCollapseParent = findLastParentDeepById(pane.id, (config) =>
    isCollapse(config),
  );
  $: isShowCollapseNum =
    !!topCollapseParent &&
    (isVGroup(getById(pane.id)) || isHGroup(getById(pane.id)));
  $: collapseNum = isShowCollapseNum
    ? findAllChildNumDeepById(pane.id, (config) => {
        return isCollapse(config) && isPane(config);
      })
    : 0;
  $: isVertical =
    direction === Split.NORTH_EDGE || direction === Split.SOUTH_EDGE;

  $: {
    // const parent = findLastParentDeepById(topCollapseParent?.id, (config) => {
    //   return !!findFirstChildDeepById(config.id, (child) => isDashboard(child));
    // });
    // const dashboardIndex = parent.children.findIndex(
    //   (config) =>
    //     isDashboard(config) ||
    //     !!findFirstChildDeepById(config.id, (child) => isDashboard(child)),
    // );
    // const topIndex = parent.children.findIndex(
    //   (config) =>
    //     config.id === topCollapseParent?.id ||
    //     !!findFirstChildDeepById(
    //       config.id,
    //       (child) => child.id === topCollapseParent?.id,
    //     ),
    // );
    // console.log(parent, dashboardIndex, topIndex);
    // if (isVGroup(parent)) {
    //   direction = dashboardIndex > topIndex ? Split.SOUTH : Split.NORTH;
    // } else {
    //   direction = dashboardIndex > topIndex ? Split.EAST : Split.WEST;
    // }
    direction =
      findPositionById(pane?.id) ||
      findPositionById(topCollapseParent?.id) ||
      Split.EAST_EDGE;
  }
  $: {
    switch (direction) {
      case Split.NORTH_EDGE:
        tooltipDirection = "bottom";
        break;
      case Split.SOUTH_EDGE:
        tooltipDirection = "top";
        break;
      case Split.WEST_EDGE:
        tooltipDirection = "right";
        break;
      case Split.EAST_EDGE:
        tooltipDirection = "left";
        break;
    }
  }

  function updateDnd(event: MouseEvent, child: Pane) {
    appDnd.update((val) => {
      return {
        ...val,
        action: DND.WORKBOOK_TAB,
        data: {
          ...val.data,
          pane: getById(child.id),
        },
      };
    });
    const bounds = elementIndicators.getBoundingClientRect();
    const boundsChild = childrenBounds[child.id];
    previewPosition = !isVertical
      ? `${boundsChild.top - bounds.top}px`
      : `${event.clientX - bounds.left}px`;
  }

  function onDragOver() {
    if (!children.some((child) => child.id === dragId)) {
      addTab({
        targetId: pane.id,
        pane: dragPane,
      });
    }
    isDragOverTop = true;
    const clientY = $appDnd.event.clientY;
    const clientX = $appDnd.event.clientX;
    let position = 0;
    if (elementIndicators && elementDrag) {
      const bounds = elementIndicators.getBoundingClientRect();
      const boundsDrag = elementDrag.getBoundingClientRect();
      position = !isVertical
        ? clientY - bounds.top - ($appDnd?.data?.offsetTop || 0)
        : clientX - bounds.left;
      position = Math.max(0, position);
      position = Math.min(
        position,
        !isVertical
          ? bounds.height - boundsDrag.height
          : bounds.width - boundsDrag.width,
      );
      previewPosition = `${position}px`;
    }

    Object.keys(childrenBounds).forEach((id) => {
      const bounds = childrenBounds[id];
      const flag = !isVertical
        ? clientY > bounds.top + 10 && clientY < bounds.top + bounds.height
        : clientX - 13 < bounds.left + bounds.width / 2 &&
          clientX + 13 > bounds.left + bounds.width / 2;
      if (flag) {
        moveTo({
          sourceId: dragId,
          targetId: id,
        });
      }
    });
  }

  function onDragOut() {
    isDragOverTop = false;
    removeById(dragId);
  }

  function useBounds(element: HTMLElement, paneChild: Pane) {
    function updateBounds() {
      const bounds = element.getBoundingClientRect();
      childrenBounds[paneChild.id] = bounds;
    }
    updateBounds();
    return {
      update() {
        updateBounds();
      },
      destroy() {
        delete childrenBounds[paneChild.id];
      },
    };
  }

  function onClickExpand() {
    const parent = findLastParentDeepById(pane.id, (config) =>
      isCollaspeGroup(config),
    );
    if (parent) {
      setCollapseById(parent.id, false);
    }
  }

  function showModal() {
    const modalElement = bind(ContainerTabModal, {
      pane: getById(pane.id),
    });
    openModal({
      component: modalElement,
      isMovable: false,
      isResizable: false,
      minWidth: 400,
      minHeight: 300,
      preferredWidth: window.innerWidth - 400,
      preferredHeight: window.innerHeight - 150,
    });
  }

  function onCloseTab(id: Pane["id"]) {
    removeById(id);
    sync();
  }

  function onCloseTabGroup() {
    removeById(pane.id);
    sync();
  }

  $: {
    childrenBounds = {};
  }

  $: {
  }
</script>

<div class={clsx("bg-white w-full h-full", !isVertical ? "pt-5" : "px-2.5")}>
  <div
    class={clsx(
      "flex items-center relative h-full",
      !isVertical ? "flex-col" : "",
    )}
    bind:this={elementIndicators}
  >
    {#each children as child, i (child.id)}
      <div
        use:contextMenuAction={{
          menuItems: [
            {
              type: MENU_DATA_ITEM_TYPE_ELEMENT,
              label: "Expand",
              state: MENU_DATA_ITEM_STATE_ENABLED,
              action: () => {
                onClickExpand();
              },
            },
            {
              type: MENU_DATA_ITEM_TYPE_ELEMENT,
              label: "Close Tab",
              state: MENU_DATA_ITEM_STATE_ENABLED,
              status: "warning",
              action: () => {
                onCloseTab(child.id);
              },
            },
            {
              type: MENU_DATA_ITEM_TYPE_ELEMENT,
              label: "Close Group",
              state: MENU_DATA_ITEM_STATE_ENABLED,
              status: "warning",
              action: () => {
                onCloseTabGroup();
              },
            },
            {
              type: MENU_DATA_ITEM_TYPE_ELEMENT,
              label: "View in Full Screen",
              state: MENU_DATA_ITEM_STATE_ENABLED,
              action: () => {
                showModal();
              },
            },
          ],
          disabled: false,
          isAtMousePosition: false,
        }}
      >
        <Drag on:dragstart={({ detail }) => updateDnd(detail.event, child)}>
          <div
            class={clsx(
              "flex justify-center items-center  hover:bg-[rgba(80,88,93,.06)]",
              !isVertical
                ? "w-[26px] h-[26px] my-0.5"
                : "h-[26px] mx-0.5 px-0.5",
            )}
            use:tooltipAction={{
              content: child?.content?.view?.label || "",
              position: tooltipDirection,
            }}
            use:useBounds={child}
          >
            {#if child.id !== dragId}
              <div class="flex item-center justify-center">
                <Icon
                  icon={child?.content?.view?.icon}
                  size="16px"
                  fill={"#0E0121"}
                />
                {#if isVertical}
                  <div class="ml-2.5 text-xs font-medium">
                    {child?.content?.view?.label}
                  </div>
                {/if}
              </div>
            {:else}
              <div
                class={clsx(
                  "w-[26px] h-full bg-[rgba(80,88,93,.06)] rounded-[3px] border border-solid border-[rgba(80,88,93,.2)]",
                )}
              ></div>
            {/if}
          </div>
        </Drag>
      </div>
    {/each}

    {#if dragId && isDragOverTop}
      <div
        class="active-drag-item bg-white w-[26px] h-[26px] flex justify-center items-center my-0.5 absolute left-1/2 transform -translate-x-1/2 z-109 opacity-80"
        style={isVertical
          ? `left: ${previewPosition}`
          : `top: ${previewPosition}`}
        bind:this={elementDrag}
      >
        <Icon icon={dragView?.icon} size="16px" fill={"#0E0121"} class="" />
      </div>
    {/if}
  </div>
  {#if isShowCollapseNum}
    <div
      class={clsx(
        "absolute w-[24px] h-[24px] rounded-full collapse-num text-xs !leading-[24px] text-center bg-white z-2000",
        {
          "top-2 -left-2": direction === Split.EAST_EDGE,
        },
        {
          "top-2 -right-2": direction === Split.WEST_EDGE,
        },
        {
          "right-2 -top-2": direction === Split.SOUTH_EDGE,
        },
        {
          "right-2 -bottom-2": direction === Split.NORTH_EDGE,
        },
      )}
      use:tooltipAction={{
        content: "Expand to view other sidepanels",
        position: tooltipDirection,
      }}
    >
      +{collapseNum}
    </div>
  {/if}
  <Drop
    phantom="none"
    zIndex={110}
    on:dragover={onDragOver}
    on:dragout={onDragOut}
  >
    <div class="absolute w-full h-full top-0 left-0 z-110" />
  </Drop>
</div>

<style lane="postcss">
  .active-drag-item {
    box-shadow: 0px 0px 4px rgba(55, 84, 170, 0.161);
  }
  .collapse-num {
    box-shadow: 0px 4px 4px rgba(55, 84, 170, 0.261);
  }
</style>
