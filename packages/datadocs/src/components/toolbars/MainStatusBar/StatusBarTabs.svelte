<script lang="ts">
  import { onMount, tick } from "svelte";
  import { watchResize } from "svelte-watch-resize";
  import {
    sheetsDataStore,
    changeSheetsData,
    isDraggingToReorderSheet,
  } from "../../../app/store/store-worksheets";
  import type { WorkbookSheet } from "../../../app/store/types";
  import SheetTab from "./SheetTab.svelte";
  import NavigationButton from "./NavigationButton.svelte";
  import AddSheetButton from "./AddSheetButton.svelte";
  import type { ScrollDirection } from "./utils";
  import {
    handleElementScroll,
    CONTEXT_MENU_CLASSNAME,
    reorderWorksheet,
  } from "./utils";
  import { TOOLTIP_POSITION_CHANGE_EVENT_NAME } from "../../common/tooltip/constant";
  import { CONTEXT_MENU_CONTAINER_ID } from "../../common/context-menu";

  let sheetsListContainer: HTMLElement;
  let sheetsListElement: HTMLElement;
  let isReordering = false;
  let autoScrollInterval = null;
  let isAutoScrolling: "" | "left" | "right" = "";
  let canScrollLeft = false;
  let canScrollRight = false;
  let contextMenuContainer: HTMLElement;

  $: sheetsData = $sheetsDataStore;
  $: isReordering, isDraggingToReorderSheet.set(isReordering);

  function handleNavigation(direction: ScrollDirection) {
    const width = sheetsListContainer.getBoundingClientRect().width;
    const delta = Math.max(width * 0.9, width - 20);

    handleElementScroll(sheetsListContainer, delta, direction);
  }

  function reorderSheetAction(tabElement: HTMLElement) {
    let tabElementBound: DOMRect = null;
    let proxyTabElement: HTMLElement = null;
    let mouseToProxyLeft: number = null;

    function addDragProxyElement(mouseX: number, mouseY: number) {
      tabElementBound = tabElement.getBoundingClientRect();

      const { top, left, width, height } = tabElementBound;
      const cloneTabElement: HTMLElement = tabElement.cloneNode(
        true
      ) as HTMLElement;
      cloneTabElement.classList.add("statusbar-tab-proxy");
      proxyTabElement = document.createElement("div");
      proxyTabElement.appendChild(cloneTabElement);

      Object.assign(proxyTabElement.style, {
        position: "absolute",
        left: left + "px",
        top: top + "px",
        width: width + "px",
        height: height + "px",
        zIndex: "9999",
      });

      mouseToProxyLeft = mouseX - left;
      tabElement.classList.add("statusbar-tab-source");
      document.body.appendChild(proxyTabElement);
    }

    function removeDragProxyElement() {
      if (proxyTabElement) {
        document.body.removeChild(proxyTabElement);
        proxyTabElement = null;
      }

      tabElement.classList.remove("statusbar-tab-source");
      mouseToProxyLeft = null;
      tabElementBound = null;
    }

    function startReordering(event: MouseEvent) {
      // console.log("startReordering ================= ");
      isReordering = true;
      addDragProxyElement(event.clientX, event.clientY);
      document.addEventListener("mousemove", handleWindownMouseMove);
      document.addEventListener("mouseup", handleWindownMouseUp);
    }

    async function stopReodering() {
      // console.log("stopReodering ================= ");
      stopAutoScroll();
      removeDragProxyElement();
      document.removeEventListener("mousemove", handleWindownMouseMove);
      document.removeEventListener("mouseup", handleWindownMouseUp);

      const oldIndex = parseInt(tabElement.dataset.sheetindex);
      let newIndex: number;
      const tabs = sheetsListElement.children;
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i] as HTMLElement;
        if (tab === tabElement) {
          newIndex = i;
        }
      }

      await reorderWorksheet(oldIndex, newIndex);
      await tick();
      scrollActiveSheetIntoview();
      isReordering = false;
    }

    function startAutoScroll(scrollTo: ScrollDirection) {
      // console.log("start auto scroll =================== ");
      if (sheetsListContainer.classList.contains("smooth-scroll")) {
        sheetsListContainer.classList.remove("smooth-scroll");
      }

      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }

      autoScrollInterval = setInterval(() => {
        handleElementScroll(sheetsListContainer, 3, scrollTo);
      }, 10);
    }

    function stopAutoScroll() {
      // console.log("stop auto scroll =================== ");
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }

      isAutoScrolling = "";
      sheetsListContainer.classList.add("smooth-scroll");
    }

    function handleReoder(event: MouseEvent) {
      if (!isReordering) {
        return;
      }

      const mouseX = event.clientX;
      const sheetsListContainerBound =
        sheetsListContainer.getBoundingClientRect();
      const tabElementBound = tabElement.getBoundingClientRect();

      // update proxy tab style
      const minLeft = sheetsListContainerBound.left - 4;
      const maxLef = sheetsListContainerBound.right;
      let left: number = mouseX - mouseToProxyLeft;
      left = Math.min(Math.max(left, minLeft), maxLef);
      Object.assign(proxyTabElement.style, {
        left: left + "px",
      });

      // auto scroll outside of the view
      if (mouseX > sheetsListContainerBound.right) {
        // when mouse is outside of tabs area, auto scroll right
        if (!isAutoScrolling) {
          isAutoScrolling = "right";
          startAutoScroll("right");
        } else if (isAutoScrolling === "left") {
          stopAutoScroll();
          isAutoScrolling = "right";
          startAutoScroll("right");
        }
      } else if (mouseX < sheetsListContainerBound.left) {
        // when mouse is outside of tabs area, auto scroll left
        if (!isAutoScrolling) {
          isAutoScrolling = "left";
          startAutoScroll("left");
        } else if (isAutoScrolling === "right") {
          stopAutoScroll();
          isAutoScrolling = "left";
          startAutoScroll("left");
        }
      } else {
        if (isAutoScrolling) {
          stopAutoScroll();
        }
      }

      const isMouseOutOfVisibleSheetsView =
        mouseX > sheetsListContainerBound.right ||
        mouseX < sheetsListContainerBound.left;
      if (isMouseOutOfVisibleSheetsView) {
        return;
      }

      // update list while dragging
      const tabs = sheetsListElement.children;
      let elementFromMouse: HTMLElement;
      let elementFromMouseBound: DOMRect;
      let isLastElement: boolean;

      function findSheetFromMousePoint(): HTMLElement {
        let result: HTMLElement = null;

        for (let i = 0; i < tabs.length; i++) {
          const element = tabs[i];
          const elementBound = element.getBoundingClientRect();

          if (mouseX >= elementBound.left && mouseX < elementBound.right) {
            result = element as HTMLElement;
            break;
          }
        }

        return result;
      }

      elementFromMouse = findSheetFromMousePoint();
      isLastElement = elementFromMouse === tabs[tabs.length - 1];

      if (!elementFromMouse || elementFromMouse === tabElement) {
        return;
      }

      let isTabElementOnLeftSide = false;
      let shouldInsertOnLeftSide = false;
      let centerPos: number;
      elementFromMouseBound = elementFromMouse.getBoundingClientRect();

      if (tabElementBound.left < elementFromMouseBound.left) {
        isTabElementOnLeftSide = true;
      } else {
        isTabElementOnLeftSide = false;
      }

      if (isTabElementOnLeftSide) {
        centerPos =
          elementFromMouseBound.left -
          tabElementBound.width +
          (tabElementBound.width + elementFromMouseBound.width) / 2;

        if (mouseX <= centerPos) {
          shouldInsertOnLeftSide = true;
        } else {
          shouldInsertOnLeftSide = false;
        }
      } else {
        centerPos =
          elementFromMouseBound.left +
          (tabElementBound.width + elementFromMouseBound.width) / 2;

        if (mouseX <= centerPos) {
          shouldInsertOnLeftSide = true;
        } else {
          shouldInsertOnLeftSide = false;
        }
      }

      if (!shouldInsertOnLeftSide) {
        // insert right
        if (isLastElement) {
          sheetsListElement.appendChild(tabElement);
        } else {
          sheetsListElement.insertBefore(
            tabElement,
            elementFromMouse.nextSibling
          );
        }
      } else {
        // insert left
        sheetsListElement.insertBefore(tabElement, elementFromMouse);
      }
    }

    function handleWindownMouseMove(event: MouseEvent) {
      if (isReordering) {
        handleReoder(event);
      }
    }

    function handleWindownMouseUp() {
      stopReodering();
    }

    function handleMouseDown(event: MouseEvent) {
      if (event.target instanceof HTMLInputElement || event.button !== 0) {
        // when doing rename or not left mouse click, prevent mouse move from triggering reorder sheets
        return;
      }

      // only trigger reorder if mouse move event happen after mouse down
      document.addEventListener("mousemove", handleMouseMoveTriggerReordering);
    }

    function handleMouseUp() {
      document.removeEventListener(
        "mousemove",
        handleMouseMoveTriggerReordering
      );
    }

    function handleMouseMoveTriggerReordering(event: MouseEvent) {
      if (isReordering) return;
      startReordering(event);
      document.removeEventListener(
        "mousemove",
        handleMouseMoveTriggerReordering
      );
    }

    tabElement.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return {
      destroy() {
        tabElement.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mouseup", handleMouseUp);
      },
    };
  }

  function scrollActiveSheetIntoview() {
    const activeSheet = sheetsListElement.querySelector(".sheet-active");

    if (!activeSheet) {
      return;
    }

    const activeSheetBound = activeSheet.getBoundingClientRect();
    const sheetsListContainerBound =
      sheetsListContainer.getBoundingClientRect();
    const activeSheetLeft = activeSheetBound.left;
    const activeSheetRight = activeSheetBound.right;
    const left = sheetsListContainerBound.left;
    const right = sheetsListContainerBound.right;

    if (activeSheetLeft >= left && activeSheetRight <= right) {
      return;
    }

    if (activeSheetBound.width >= sheetsListContainerBound.width) {
      let delta = left - activeSheetLeft;
      const direction: ScrollDirection = delta > 0 ? "left" : "right";
      delta = Math.abs(delta + 4);
      handleElementScroll(sheetsListContainer, delta, direction);
    } else if (activeSheetLeft < left) {
      let delta = left - activeSheetLeft;
      delta += 4;
      handleElementScroll(sheetsListContainer, delta, "left");
    } else if (activeSheetRight > right) {
      let delta = activeSheetRight - right;
      delta += 4;
      handleElementScroll(sheetsListContainer, delta, "right");
    }
  }

  function updateScrollIndicator() {
    const scrollLeft = sheetsListContainer.scrollLeft;
    const sheetsListContainerBound =
      sheetsListContainer.getBoundingClientRect();

    canScrollLeft = scrollLeft >= 1;
    canScrollRight =
      scrollLeft + sheetsListContainerBound.width + 1 <
      sheetsListContainer.scrollWidth;
  }

  function fireUpdateTooltipPositionEvent() {
    const e = new CustomEvent(TOOLTIP_POSITION_CHANGE_EVENT_NAME, {
      detail: {},
    });

    document.dispatchEvent(e);
  }

  function handleScroll() {
    updateScrollIndicator();
    fireUpdateTooltipPositionEvent();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const element = contextMenuContainer
        ? contextMenuContainer.querySelector(`.${CONTEXT_MENU_CLASSNAME}`)
        : document.querySelector(`.${CONTEXT_MENU_CLASSNAME}`);

      if (element) {
        event.preventDefault();
      }
    }
  }

  function handleStatusBarResize(node: HTMLElement) {
    if (sheetsListContainer) {
      updateScrollIndicator();
    }
  }

  onMount(() => {
    contextMenuContainer = document.getElementById(CONTEXT_MENU_CONTAINER_ID);
    sheetsListContainer.addEventListener("scroll", handleScroll);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      sheetsListContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  });
</script>

<NavigationButton {handleNavigation} {canScrollLeft} {canScrollRight} />

<div class="relative h-full" style="max-width: calc(100% - 50px)">
  <div
    bind:this={sheetsListContainer}
    use:watchResize={handleStatusBarResize}
    class="bar-tabs smooth-scroll h-[40px] w-full flex flex-row items-center -mb-1.5 pb-1.5 overflow-x-auto overflow-y-hidden"
  >
    <div
      bind:this={sheetsListElement}
      class="h-full flex flex-row items-center px-1.5"
    >
      {#each sheetsData as sheet, i (sheet.id)}
        <div
          class="tab relative"
          class:sheet-active={sheet.isActive}
          data-sheetindex={i}
          use:reorderSheetAction
        >
          <SheetTab data={sheet} {scrollActiveSheetIntoview} />

          <div class="corner-container">
            <div class="left-corner">
              <svg
                width="8px"
                height="6px"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 M 100 0 L 125 0 L 125 100 L 100 100 Z"
                  fill="white"
                  transform="scale(1,-1) translate(0,-100)"
                />

                <path
                  d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 M 100 0 L 125 0 L 125 100 L 100 100 Z"
                  fill="currentColor"
                  transform="scale(1,-1) translate(0,-100)"
                />
              </svg>
            </div>

            <div class="right-corner">
              <svg
                width="8px"
                height="6px"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 M 100 0 L 125 0 L 125 100 L 100 100 Z"
                  fill="white"
                  transform="scale(-1,-1) translate(-100,-100)"
                />

                <path
                  d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 M 100 0 L 125 0 L 125 100 L 100 100 Z"
                  fill="currentColor"
                  transform="scale(-1,-1) translate(-100,-100)"
                />
              </svg>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  {#if canScrollLeft}
    <div class="left-scroll-indicator" />
  {/if}

  {#if canScrollRight}
    <div class="right-scroll-indicator" />
  {/if}
</div>

<AddSheetButton {scrollActiveSheetIntoview} />

<style lang="postcss">
  .tab {
    @apply mr-px mb-1;
    box-shadow: 0px 0px 4px rgba(55, 84, 170, 0.16);
    background-color: #f7f9fa;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    z-index: 1;
    height: 30px;
  }

  .tab.sheet-active {
    @apply mb-0 bg-white;
    clip-path: inset(0px -15px -10px -15px);
    z-index: 2000;
    margin-top: -1px;
    padding-top: 1px;
    height: 34px;
    box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.161);
  }

  :global(.statusbar-tab-proxy).tab.sheet-active {
    margin-top: 0px;
    padding-top: 0px;
  }

  .left-corner {
    position: absolute;
    width: 8px;
    height: 6px;
    top: 0px;
    left: -6px;
    z-index: 10;
  }

  .right-corner {
    position: absolute;
    width: 8px;
    height: 6px;
    top: 0px;
    right: -6px;
    z-index: 10;
  }

  .tab .corner-container {
    color: #f7f9fa;
  }

  .tab.sheet-active .corner-container {
    color: white;
  }

  /* hide scrollbar */
  .bar-tabs::-webkit-scrollbar {
    display: none;
  }

  .bar-tabs {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  /* smooth scroll */
  .smooth-scroll {
    scroll-behavior: smooth;
  }

  .left-scroll-indicator {
    @apply absolute top-0 bottom-0 left-0 w-4 pointer-events-none z-2001;
    background: linear-gradient(90deg, #f7f7f7 0%, rgba(247, 247, 247, 0) 100%);
    box-shadow: inset 0 4px 6px -4px rgba(55, 84, 170, 0.14);
    clip-path: inset(0px 4px 0px 0px);
  }

  .right-scroll-indicator {
    @apply absolute top-0 bottom-0 right-0 w-4 pointer-events-none z-2001;
    background: linear-gradient(90deg, rgba(247, 247, 247, 0) 0%, #f7f7f7 100%);
    box-shadow: inset 0 4px 6px -4px rgba(55, 84, 170, 0.14);
    clip-path: inset(0px 0px 0px 4px);
  }
</style>
