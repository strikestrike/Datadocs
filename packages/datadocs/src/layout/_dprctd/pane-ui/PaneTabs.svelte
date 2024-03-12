<!-- @component
@packageModule(layout/FlexTabs)
-->
<script lang="ts">
  import clsx from "clsx";
  import { afterUpdate, createEventDispatcher, getContext } from "svelte";
  import { GLOBAL_CONTEXT } from "../core/constants";
  import { indexByObject } from "../core/utils";
  import PaneTab from "./PaneTab.svelte";

  import type { GlobalContext, Pane, Tab, View } from "../types";

  // const TAB_STICKINESS_VERTICAL = 60;
  // const TAB_STICKINESS_HORIZONTAL = 60;
  // const TAB_STICKINESS_HORIZONTAL_OPEN = 75;

  const TAB_STICKINESS_VERTICAL = 20;
  const TAB_STICKINESS_HORIZONTAL = 20;
  const TAB_STICKINESS_HORIZONTAL_OPEN = 20;

  const END_ADJUST = 0;

  let tabsElement = null;
  let tabsListElement = null;

  let showLabelsAlso = false;

  export let pane: Pane;

  export let tabs = [];
  export let newTabs = [];

  export let mode = "open";

  export let paneIndex = -1;
  export let activeIndex = 0;
  export let isInner = false;

  export let showIcon = false;
  export let iconSize = "16px";

  export let activeFillColor = "#3bc7ff";

  export let tabsListClass = "";

  export let tabsClass =
    "w-full flex flex-row justify-between items-center relative h-8";

  export let tabClass = "";

  export let tabLabelClass = "";

  export let isMouseDown = false;

  export let isDropTarget = false;

  export let paneData = {};
  export let tabsData = [];
  export let newTabsData = [];

  export let dragSource = null;

  export let dragSourceProxy = null;

  export let dragType = "";

  export let tabType = "";

  export let paneOrientation = "";

  export let dragHandlers = null;

  export let dropZoneHandler = null;

  export let onTabMove = null;

  export let getTabProps = (tab: any, props: View): View => {
    return (
      tab?.content?.view || {
        id: "",
        name: "",
        label: "",
        icon: "",
      }
    );
  };

  const TAB_OPTIONS_CLASS =
    "absolute top-0 bottom-0 right-0 w-3 h-full flex flex-col justify-start z-9999 pointer-events-none";

  const dispatch = createEventDispatcher();

  const globalContext: GlobalContext = getContext(GLOBAL_CONTEXT);

  let hasMoveListener = false;

  function onActiveTabChange(index) {
    activeTabIndex = index;
    dispatch("tabchange", {
      activeTabIndex,
    });
  }

  function toggleType(target, type) {
    if (target) {
      if (type === "label") {
        target.classList.remove("show-icon");
        target.classList.add("show-label");
        target.classList.add("tab-active");
      } else if (type === "icon") {
        target.classList.remove("show-label");
        target.classList.remove("tab-active");
        target.classList.add("show-icon");
      }
    }
  }

  function toggleTab(mode, dragType, target, revese = false) {
    if (!isClosed && dragType === "tab-closed") {
      toggleType(target, !revese ? "label" : "icon");
    } else if (isClosed && dragType === "tab-open") {
      toggleType(target, !revese ? "icon" : "label");
    }
  }

  function calculateXY(target) {
    let xStart,
      xEnd,
      xPos = null,
      yStart,
      yEnd,
      yPos = null;
    if (target !== null) {
      // const simpleTabsBounds = target.getBoundingClientRect();
      const tabsBounds = tabsElement.getBoundingClientRect();
      // const tabsListBounds = tabsListElement.getBoundingClientRect();
      const tabElements = tabsListElement.children;
      const tabsCount = tabElements.length;
      xStart = tabsBounds.x;
      xEnd = tabsBounds.x + tabsBounds.width;
      yStart = tabsBounds.y;
      yEnd = tabsBounds.y + tabsBounds.height;
      if (!isClosed || paneOrientation === "horizontal") {
        yPos = [tabsBounds.y, tabsBounds.y + tabsBounds.height];
        xPos = [];
        for (let i = 1; i < tabsCount; i++) {
          const child = tabElements[i];
          const childBounds = child.getBoundingClientRect();
          xPos.push(childBounds.x);
        }
      } else {
        xPos = [tabsBounds.x, tabsBounds.x + tabsBounds.width];
        yPos = [];
        for (let i = 1; i < tabsCount; i++) {
          const child = tabElements[i];
          const childBounds = child.getBoundingClientRect();
          yPos.push(childBounds.y);
        }
      }
      // console.log("Tabs updating ...");
      // console.log("--------");
      // console.log(tabs.map((tab) => tab.label));
      // console.log(xPos);
      // console.log(yPos);
      // console.log("--------");
    }
    return {
      xStart,
      xEnd,
      xPos,
      yStart,
      yEnd,
      yPos,
    };
  }

  function handleMouseDown() {}

  function handleMouseMove(target, tabsStatus, mouseX, mouseY) {
    if (
      isMouseDown &&
      dragSource &&
      (dragType === "tab-open" || dragType === "tab-closed")
    ) {
      const isSamePane = dragSource.parentElement === tabsListElement;

      let { xPos, yPos, movingIndex, dragTabDummy, dragDummyBounds } =
        tabsStatus;

      let dragTab = isSamePane
        ? dragSource
        : dragTabDummy !== null
        ? dragTabDummy
        : dragSource;

      // let { tabname: tabName, dndtype: dndType } = currentTab.dataset;
      // let { tabname: dragTabName } = dragTab.dataset;

      console.groupCollapsed("FlexTabs");

      let at = -1;
      if (!isClosed || paneOrientation === "horizontal") {
        console.log("mouseX  " + mouseX);
        for (let i = 0; i < xPos.length && xPos[0] < mouseX; i++) {
          if (
            mouseX > xPos[i] &&
            xPos[i + 1] !== undefined &&
            mouseX <= xPos[i + 1]
          ) {
            at = i;
            break;
          } else {
            at = i + 1;
          }
        }
      } else {
        console.log("mouseY  " + mouseY);
        for (let i = 0; i < yPos.length && yPos[0] < mouseY; i++) {
          if (
            mouseY > yPos[i] &&
            yPos[i + 1] !== undefined &&
            mouseY <= yPos[i + 1]
          ) {
            at = i;
            break;
          } else {
            at = i + 1;
          }
        }
      }
      at = Math.max(0, at + 1);

      console.log("X/Y at " + at + " " + Date.now());

      if (!isClosed || paneOrientation === "horizontal") {
        if (isSamePane) {
          console.log("movingIndex", tabsStatus.movingIndex);
          if (at + 1 < tabsList.length) {
            const insertAt = tabsStatus.movingIndex < at ? at + 1 : at;
            console.log("insertAt", insertAt);
            tabsListElement.insertBefore(
              dragTab,
              tabsListElement.children[insertAt]
            );
            tabsStatus.movingIndex = at;
          } else {
            tabsListElement.appendChild(dragTab);
            tabsStatus.movingIndex = tabsList.length - 1;
          }
        } else {
          if (dragTabDummy === null) {
            dragTab = dragTabDummy = dragSource.cloneNode(true);
            // dragTabDummy.classList.remove("tab-active", "off-tabs");
            // dragTabDummy.classList.add("dummy");
            dragTabDummy.classList.remove("off-tabs");
            dragTabDummy.classList.add("tab-active", "dummy");
            toggleTab(mode, dragType, dragTabDummy);
            // toggleTab(mode, dragType, dragSourceProxy);
            tabsListElement.appendChild(dragTabDummy);
            dragDummyBounds = dragTabDummy.getBoundingClientRect();
            const { xPos, yPos } = calculateXY(tabsElement);
            tabsStatus.xPos = xPos;
            tabsStatus.yPos = yPos;
          }
          console.log("movingIndex", tabsStatus.movingIndex);
          if (at + 1 < tabsList.length + (dragTabDummy !== null ? 1 : 0)) {
            const insertAt = tabsStatus.movingIndex < at ? at + 1 : at;
            console.log("insertAt", insertAt);
            tabsListElement.insertBefore(
              dragTab,
              tabsListElement.children[insertAt]
            );
            tabsStatus.movingIndex = at;
          } else {
            tabsListElement.appendChild(dragTab);
            tabsStatus.movingIndex = tabsList.length - 1;
          }
        }
      } else {
        if (isSamePane) {
          console.log("movingIndex", tabsStatus.movingIndex);
          if (at + 1 < tabsList.length) {
            const insertAt = tabsStatus.movingIndex < at ? at + 1 : at;
            console.log("insertAt", insertAt);
            tabsListElement.insertBefore(
              dragTab,
              tabsListElement.children[insertAt]
            );
            tabsStatus.movingIndex = at;
          } else {
            tabsListElement.appendChild(dragTab);
            tabsStatus.movingIndex = tabsList.length - 1;
          }
        } else {
          if (dragTabDummy === null) {
            dragTab = dragTabDummy = dragSource.cloneNode(true);
            dragTabDummy.classList.remove("tab-active", "off-tabs");
            dragTabDummy.classList.add("dummy");
            toggleTab(mode, dragType, dragTabDummy);
            // toggleTab(mode, dragType, dragSourceProxy);
            tabsListElement.appendChild(dragTabDummy);
            dragDummyBounds = dragTabDummy.getBoundingClientRect();
            const { xPos, yPos } = calculateXY(tabsElement);
            tabsStatus.xPos = xPos;
            tabsStatus.yPos = yPos;
          }
          console.log("movingIndex", tabsStatus.movingIndex);
          if (at + 1 < tabsList.length + (dragTabDummy !== null ? 1 : 0)) {
            const insertAt = tabsStatus.movingIndex < at ? at + 1 : at;
            console.log("insertAt", insertAt);
            tabsListElement.insertBefore(
              dragTab,
              tabsListElement.children[insertAt]
            );
            tabsStatus.movingIndex = at;
          } else {
            tabsListElement.appendChild(dragTab);
            tabsStatus.movingIndex = tabsList.length - 1;
          }
        }
      }
      tabsStatus.dragTabDummy = dragTabDummy;
      tabsStatus.dragDummyBounds = dragDummyBounds;

      console.log("onTabMove === ", true);
      onTabMove(true, {
        dragDummyBounds,
      });

      console.groupEnd();
    }
  }

  function handleMouseUp() {}

  function handleWindowMouseUp(tabsStatus) {
    // console.log(
    //   "Tabs Dragging Window Up... ",
    //   tabs.map((tab) => tab.label)
    // );
    if (dragType === "tab-open" || dragType === "tab-closed") {
      if (dragSource) {
        const isSamePane = dragSource.parentElement === tabsListElement;
        const children = tabsListElement.children;
        if (isSamePane) {
          const newList = [];
          let active = activeTabIndex;
          for (var i = 0; i < children.length; i++) {
            const tabChild = children[i];
            const index = parseInt(tabChild.dataset.index);
            newList.push(tabsList[index]);
            if (activeTabIndex === index) {
              active = i;
            }
          }
          onTabMove(true, {
            tabsList: newList,
            dndType: "tab",
            active,
          });
        } else if (tabsStatus.dragTabDummy !== null) {
          const tabIndex = indexByObject(children, tabsStatus.dragTabDummy);
          onTabMove(true, {
            tabIndex,
            dndType: "tab",
          });
        }
      }
    }
  }

  function removeDummy(tabsStatus) {
    if (
      tabsStatus.dragTabDummy !== null &&
      tabsStatus.dragTabDummy.parentElement
    ) {
      let children = [];

      tabsStatus.dragTabDummy.parentElement.removeChild(
        tabsStatus.dragTabDummy
      );

      children = tabsListElement.children;
      for (var i = 0; i < children.length; i++) {
        const tabChild = children[i];
        tabChild.dataset.tabindex = i;
      }
    }
    tabsStatus.dragTabDummy = null;
    tabsStatus.dragTabDummyBounds = null;
  }

  function mouseHandlers(tabsElement) {
    const status = {
      xStart: 0,
      xEnd: 0,
      xPos: [],
      yStart: 0,
      yEnd: 0,
      yPos: [],
      dragTabDummy: null,
      dragTabDummyBounds: null,
      movingIndex: -1,
    };
    let tabsStatus = { ...status };

    // let addedNewTabs = false;

    function updateXY() {
      const { xStart, xEnd, xPos, yStart, yEnd, yPos } =
        calculateXY(tabsElement);
      tabsStatus.xStart = xStart;
      tabsStatus.xEnd = xEnd;
      tabsStatus.xPos = xPos;
      tabsStatus.yStart = yStart;
      tabsStatus.yEnd = yEnd + 10;
      tabsStatus.yPos = yPos;
    }

    function onMouseEnter() {}

    // function onMouseLeave() {
    //   clearNewTabs();
    // }

    function onMouseDown() {
      updateXY();
      handleMouseDown();
      if (!hasMoveListener) {
        if (dragType === "tab-open" || dragType === "tab-closed") {
          startDragging();
        }
      }
    }

    function onMouseMove() {
      // console.log("tabs check onMouseMove ", dragSource);
      if (isMouseDown && !hasMoveListener && dragSource !== null) {
        if (dragType === "tab-open" || dragType === "tab-closed") {
          startDragging();
        }
      } else if (dragSource === null && hasMoveListener) {
        stopDragging();
        return;
      }
    }

    function onMouseUp() {}

    function startDragging() {
      if (dragSource !== null) {
        updateXY();
        window.addEventListener("mousemove", onWindowMouseMove);
        window.addEventListener("mouseup", onWindowMouseUp, true);
        hasMoveListener = true;
        console.groupCollapsed("FlexTabs");
        console.log(
          "Tabs Dragging Start... ",
          tabs.map((tab) => tab.label)
        );
        console.groupEnd();
      }
    }

    function stopDragging(update = true) {
      if (hasMoveListener) {
        window.removeEventListener("mousemove", onWindowMouseMove);
        window.removeEventListener("mouseup", onWindowMouseUp, true);
        hasMoveListener = false;
        if (update) {
          onTabMove(false);
          // toggleTab(mode, dragType, dragSourceProxy, true);
          // toggleTab(mode, dragType, dragSourceProxy, true);
        }
        removeDummy(tabsStatus);
        tabsStatus = { ...status };
        console.groupCollapsed("FlexTabs");
        console.log(
          "Tabs Dragging Stop... ",
          tabs.map((tab) => tab.label)
        );
        console.groupEnd();
      }
    }

    // function addNewTabs(proxy) {
    //   if (!addedNewTabs && proxy !== null) {
    //     const tabs = proxy.querySelectorAll(".tabs-list > .flex-tab");
    //     if (tabs && tabs.length > 0) {
    //       const count = tabs.length;
    //       for (let i = 0; i < count; i++) {
    //         const tab = tabs[i];
    //         const { tabname: tabName, tablabel: tabLabel } = tab.dataset;
    //         newTabs.push({
    //           name: tabName,
    //           icon: tabName,
    //           label: tabLabel,
    //         });
    //       }
    //     }
    //     addedNewTabs = true;
    //   }
    // }

    // function clearNewTabs() {
    //   if (addedNewTabs) {
    //     newTabs = [];
    //     addedNewTabs = false;
    //   }
    // }

    function onWindowMouseMove(event) {
      if (dragSource === null && hasMoveListener) {
        stopDragging();
        return;
      }

      console.groupCollapsed("FlexTabs");

      if (!isClosed) {
        console.log(event.clientY, tabsStatus.yPos[1] + tabsStatus.yPos[0]);
        const yDelta =
          event.clientY - (tabsStatus.yPos[1] + tabsStatus.yPos[0]) / 2;
        if (
          Math.abs(yDelta) > TAB_STICKINESS_HORIZONTAL_OPEN ||
          event.clientX < tabsStatus.xStart ||
          event.clientX > tabsStatus.xEnd + END_ADJUST
        ) {
          stopDragging();
        } else if (
          yDelta < -TAB_STICKINESS_HORIZONTAL_OPEN + 12 &&
          yDelta >= -TAB_STICKINESS_HORIZONTAL_OPEN
        ) {
          onTabMove(true, {
            onTabsNorth: true,
          });
        }
      } else {
        console.log(event.clientX, tabsStatus.xPos[1] + tabsStatus.xPos[0]);
        if (paneOrientation === "horizontal") {
          const yDelta =
            event.clientY - (tabsStatus.yPos[1] + tabsStatus.yPos[0]) / 2;
          if (
            Math.abs(yDelta) > TAB_STICKINESS_HORIZONTAL ||
            event.clientX < tabsStatus.xStart ||
            event.clientX > tabsStatus.xEnd + END_ADJUST
          ) {
            stopDragging();
          }
        } else {
          const xDelta =
            event.clientX - (tabsStatus.xPos[1] + tabsStatus.xPos[0]) / 2;
          if (
            Math.abs(xDelta) > TAB_STICKINESS_VERTICAL ||
            event.clientY < tabsStatus.yStart ||
            event.clientY > tabsStatus.yEnd + END_ADJUST
          ) {
            stopDragging();
          }
        }
      }

      if (hasMoveListener) {
        handleMouseMove(tabsElement, tabsStatus, event.clientX, event.clientY);
      }

      console.groupEnd();
    }

    function onWindowMouseUp() {
      if (hasMoveListener) {
        handleWindowMouseUp(tabsStatus);
      }
      stopDragging(false);
      tabsStatus = { ...status };
      // clearNewTabs();
    }

    // simpleTabs.addEventListener("mouseenter", onMouseEnter);
    // tabsElement.addEventListener("mouseleave", onMouseLeave);
    tabsElement.addEventListener("mousemove", onMouseMove);
    tabsElement.addEventListener("mousedown", onMouseDown);
    tabsElement.addEventListener("mouseup", onMouseUp);

    return {
      destroy() {
        // simpleTabs.removeEventListener("mouseenter", onMouseEnter);
        // tabsElement.removeEventListener("mouseleave", onMouseLeave);
        tabsElement.removeEventListener("mousemove", onMouseMove);
        tabsElement.removeEventListener("mousedown", onMouseDown);
        tabsElement.removeEventListener("mouseup", onMouseUp);
      },
    };
  }

  afterUpdate(async () => {
    // showLabelsAlso
    if (tabsElement) {
      const tabsBounds: DOMRect = tabsElement.getBoundingClientRect();
      let wordWidth = 0;

      for (let i = 0; i < tabsList.length; i++) {
        const tab: Tab = tabsList[i];
        const tabLabel = tab.label || "";
        const labelWidth = 30 + tabLabel.length * 7;
        wordWidth += labelWidth;
      }

      if (wordWidth > 0 && wordWidth < tabsBounds.width) {
        showLabelsAlso = true;
      }
    }
  });

  $: tabsList = tabs;
  $: tabsListData = tabsData;
  $: tabsCount = tabs.length;

  // $: newTabs = [];

  $: activeTabIndex = activeIndex;
  $: activeTab = tabs[activeTabIndex];

  $: isClosed = mode === "closed";

  $: preventDragTab = tabsCount === 1 && !isClosed;

  $: showLabelsAlso = false;

  $: {
    if (onTabMove === null) {
      onTabMove = () => {};
    }

    if (dragHandlers === null) {
      dragHandlers = () => {};
    }

    if (dropZoneHandler === null) {
      dropZoneHandler = () => {};
    }
  }
</script>

<div
  class={`simple-tabs ${isClosed ? "closed-tabs" : "open-tabs"} ${
    paneOrientation ? paneOrientation : "vertical"
  }`}
  class:first-pane={!isInner || paneIndex === 0}
>
  <div
    class={`tabs tabs-bar-container ${
      !isClosed
        ? tabsClass
        : paneOrientation === "horizontal"
        ? "w-full h-full flex flex-row justify-start"
        : "w-full h-full flex flex-col justify-start"
    } ${isMouseDown ? "dnd-item" : ""}`}
    class:drop-target={isDropTarget && !isClosed}
    use:dragHandlers
    use:mouseHandlers
    use:dropZoneHandler
    use:globalContext.actions.tabsAction={[pane, isMouseDown]}
    bind:this={tabsElement}
    {...paneData}
  >
    <div
      class={`tabs-list ${tabsListClass} ${
        paneOrientation ? paneOrientation : "vertical"
      } ${mode}`}
      class:dropping={isDropTarget}
      bind:this={tabsListElement}
    >
      {#each tabsList as tab, i (tab.id)}
        <PaneTab
          {pane}
          tab={getTabProps(tab, {
            id: "",
            name: "",
            label: "",
            icon: "",
          })}
          tabIndex={i}
          activeIndex={activeTabIndex}
          isActive={activeTabIndex === i && !showIcon}
          {dragSource}
          {activeFillColor}
          tabClass={clsx(
            tabClass,
            tabsCount === 1 && !isClosed
              ? ""
              : isMouseDown
              ? "pointer-events-none"
              : ""
          )}
          {tabLabelClass}
          {showIcon}
          showLabel={!isClosed}
          showLabelAlso={isClosed &&
            showLabelsAlso &&
            paneOrientation === "horizontal"}
          {iconSize}
          {isMouseDown}
          data={{ ...tabsListData[i], "data-preventdragtab": preventDragTab }}
          {paneOrientation}
          {dragHandlers}
          on:mousedown={() => {
            onActiveTabChange(i);
          }}
          class={clsx(isMouseDown && "active-drag-item")}
        />
      {/each}
      {#if newTabs.length > 0}
        {#each newTabs as tab, i (tab.id)}
          <PaneTab
            {pane}
            {tab}
            tabIndex={tabsCount + i}
            activeIndex={activeTabIndex}
            isActive={activeTabIndex === tabsCount + i && !showIcon}
            {dragSource}
            {activeFillColor}
            tabClass={clsx(tabClass, "pointer-events-none")}
            {tabLabelClass}
            {showIcon}
            showLabel={!isClosed}
            {iconSize}
            {isMouseDown}
            data={{
              "data-dndtype": "tab",
              "data-index": tabsCount + i,
              "data-tabindex": tabsCount + i,
              "data-tabname": tab.name,
              "data-tablabel": tab.label,
            }}
            {paneOrientation}
          />
        {/each}
      {/if}
    </div>

    <!-- tabsOptions is defined on open mode, can be over tabs -->
    <div class={TAB_OPTIONS_CLASS}>
      <slot name="tabsOptions" />
    </div>

    <div class="bottom-border-shadow" />
  </div>

  <div class="tab-active-content" class:hidden={isClosed}>
    <slot name="activeTab" {activeTab} {activeTabIndex} />
  </div>
</div>

<!--
  // function handleMouseMoveTabs(event) {

  //   const mouseX = event.clientX;
  //   const mouseY = event.clientY;
  //   if (inList) {
  //     return;
  //   }
  //   if (isMouseDown && (dragType === "tab-open" || dragType === "tab-closed")) {
  //     toggleTab(mode, dragType, dragSourceProxy);
  //     if (dragSource) {
  //       let isSamePane = dragSource.parentElement === tabsListElement;
  //       if (!isSamePane) {
  //         let dragTab = dragTabDummy !== null ? dragTabDummy : dragSource;

  //         // const lastTab =
  //         // tabsListData instanceof Array &&
  //         // tabsListData[tabsListData.length - 1];

  //         if (dragTabDummy === null) {
  //           const tabListBounds = tabsListElement.getBoundingClientRect();
  //           dragTab = dragTabDummy = dragSource.cloneNode(true);
  //           dragTabDummy.classList.remove("tab-active");
  //           toggleTab(mode, dragType, dragTabDummy, true);
  //           if (
  //             (paneOrientation === "horizontal" &&
  //               mouseX < tabListBounds.x + tabListBounds.width / 2) ||
  //             (paneOrientation === "vertical" &&
  //               mouseY < tabListBounds.y + tabListBounds.height / 2)
  //           ) {
  //             tabsListElement.insertBefore(
  //               dragTabDummy,
  //               tabsListElement.firstChild
  //             );
  //           } else {
  //             tabsListElement.appendChild(dragTabDummy);
  //           }
  //         }
  //         onTabMove(true, {
  //           dragDummyBounds: dragTabDummyBounds,
  //         });
  //       }
  //     }
  //   }
  // }

  // function handleMouseUpTabs() {
  //   if (inList) {
  //     return;
  //   }
  //   if (isMouseDown && (dragType === "tab-open" || dragType === "tab-closed")) {
  //     if (dragSource) {
  //       let { dndtype: dndType } = dragTabDummy.dataset;
  //       let children = tabsListElement.children;
  //       if (dragTabDummy !== null) {
  //         const tabIndex = indexByObject(children, dragTabDummy);
  //         onTabMove(true, {
  //           tabIndex,
  //           dndType,
  //         });
  //       }
  //     }
  //   }
  // }

  // function handleMouseLeaveTabs() {
  //   if (inList) {
  //     return;
  //   }
  //   handleMouseLeave(null);
  // }

  // function handleMouseMove(event) {

  //   if (isMouseDown && (dragType === "tab-open" || dragType === "tab-closed")) {
  //     const currentTab = event.target;
  //     if (dragSource && currentTab.parentElement === tabsListElement) {
  //       let isSamePane = dragSource.parentElement === tabsListElement;
  //       let dragTab = isSamePane
  //         ? dragSource
  //         : dragTabDummy !== null
  //         ? dragTabDummy
  //         : dragSource;

  //       let { tabname: tabName, dndtype: dndType } = currentTab.dataset;
  //       let { tabname: dragTabName } = dragTab.dataset;

  //       const xChange = event.clientX - currentX;

  //       if (isSamePane) {
  //         if (tabName !== dragTabName) {
  //           if (xChange < 0) {
  //             tabsListElement.insertBefore(dragTab, currentTab);
  //           } else if (xChange > 0) {
  //             tabsListElement.insertBefore(dragTab, currentTab.nextSibling);
  //           }
  //         }
  //       } else {
  //         if (dragTabDummy === null) {
  //           dragTab = dragTabDummy = dragSource.cloneNode(true);
  //           dragTabDummy.classList.remove("tab-active");
  //           toggleTab(mode, dragType, dragTabDummy);
  //           tabsListElement.appendChild(dragTabDummy);
  //           dragTabDummyBounds = dragTabDummy.getBoundingClientRect();
  //         }
  //         if (dragTab) {
  //           if (tabName !== dragTabName) {
  //             if (xChange < 0) {
  //               tabsListElement.insertBefore(dragTab, currentTab);
  //             } else if (xChange > 0) {
  //               tabsListElement.insertBefore(dragTab, currentTab.nextSibling);
  //             }
  //           }
  //         }
  //       }
  //       onTabMove(true, {
  //         dragDummyBounds: dragTabDummyBounds,
  //       });
  //     }
  //     currentX = event.clientX;
  //   }
  // }

  // function handleMouseEnter(event) {
  //   if (tabsListElement !== null) {
  //     currentX = 0;
  //     tabsListElement.addEventListener("mousemove", handleMouseMove);
  //     if (
  //       isMouseDown &&
  //       dragSourceProxy &&
  //       (dragType === "tab-open" || dragType === "tab-closed")
  //     ) {
  //       toggleTab(mode, dragType, dragSourceProxy);
  //     }
  //   }
  //   inList = true;
  // }

  // function handleMouseLeave(event) {
  //   if (
  //     isMouseDown &&
  //     dragSourceProxy &&
  //     (dragType === "tab-open" || dragType === "tab-closed")
  //   ) {
  //     onTabMove(false);
  //     removeDummy();
  //   }
  //   tabsListElement.removeEventListener("mousemove", handleMouseMove);
  //   toggleTab(mode, dragType, dragSourceProxy, true);
  //   setTimeout(() => {
  //     inList = false;
  //   }, 0);
  // }

  // function handleMouseUp(event) {
  //   let currentTab = event.target;
  //   if (
  //     isMouseDown &&
  //     (dragType === "tab-open" || dragType === "tab-closed") &&
  //     currentTab.parentElement === tabsListElement
  //   ) {
  //     if (dragSource) {
  //       let isSamePane = dragSource.parentElement === tabsListElement;
  //       let { dndtype: dndType } = currentTab.dataset;
  //       let children = tabsListElement.children;
  //       if (isSamePane) {
  //         let newList = [];
  //         let active = activeTabIndex;
  //         for (var i = 0; i < children.length; i++) {
  //           const tabChild = children[i];
  //           const index = parseInt(tabChild.dataset.index);
  //           newList.push(tabsList[index]);
  //           if (activeTabIndex === index) {
  //             active = i;
  //           }
  //         }
  //         onTabMove(true, {
  //           tabsList: newList,
  //           dndType,
  //           active,
  //         });
  //       } else if (dragTabDummy !== null) {
  //         const tabIndex = indexByObject(children, dragTabDummy);
  //         onTabMove(true, {
  //           tabIndex,
  //           dndType,
  //         });
  //       }
  //     }
  //   }
  //   setTimeout(() => {
  //     inList = false;
  //   }, 0);
  // }

  // function handleWindowMouseUp(event) {
  //   removeDummy();
  // }

  // function removeDummy() {
  //   if (dragTabDummy !== null && dragTabDummy.parentElement) {
  //     let children = [];

  //     dragTabDummy.parentElement.removeChild(dragTabDummy);

  //     children = tabsListElement.children;
  //     for (var i = 0; i < children.length; i++) {
  //       const tabChild = children[i];
  //       tabChild.dataset.tabindex = i;
  //     }
  //   }
  //   dragTabDummy = null;
  //   dragTabDummyBounds = null;
  // }

-->
<style lang="postcss">
  .simple-tabs {
    @apply w-full h-full overflow-hidden;
  }

  .simple-tabs.open-tabs {
    @apply flex flex-col;
  }

  .simple-tabs.closed-tabs {
    @apply flex justify-center items-center;
  }

  .simple-tabs.closed-tabs.horizontal {
    @apply flex-row;
  }

  /* .simple-tabs.first-pane.closed-tabs.horizontal {
    @apply ml-4;
  } */

  .simple-tabs.closed-tabs.vertical {
    @apply flex-col;
  }

  .open-tabs .tabs {
    @apply bg-panels-bg;
    z-index: 1;
  }

  .tabs-list {
    @apply flex items-center pointer-events-none;
    -webkit-transition: background 250ms ease-out;
    -moz-transition: background 250ms ease-out;
    -o-transition: background 250ms ease-out;
    transition: background 250ms ease-out;
  }

  .tabs-list.horizontal {
    @apply flex-row;
  }

  .tabs-list.vertical {
    @apply flex-col;
  }

  .tabs-list.open {
    @apply flex-row h-full;
  }

  .tabs-list.closed {
    @apply bg-white justify-center;
  }

  .tabs-list.horizontal.closed {
    @apply w-auto ml-4;
  }

  .tabs-list.vertical.closed {
    @apply h-auto mt-2.5;
  }

  .tabs-list.horizontal.closed :global(.flex-tab) {
    @apply mx-0.5;
  }

  .tabs-list.vertical.closed :global(.flex-tab) {
    @apply my-0.5;
  }

  .tabs-list > :global(*):not(.pointer-events-none) {
    @apply pointer-events-auto;
  }

  .tabs.drop-target {
    /* background: rgba(80, 88, 93, 0.1); */
  }

  .tabs-list.horizontal.open.dropping {
    padding-right: 100px;
  }

  .tabs-list.horizontal.closed.dropping {
    padding-right: 80px;
  }

  .tabs-list.vertical.closed.dropping {
    padding-bottom: 80px;
  }

  .tab-active-content {
    @apply flex-auto w-full;
    height: calc(100% - 32px);
    z-index: 2;
  }

  .bottom-border-shadow {
    position: absolute;
    opacity: 0;
    left: 0px;
    right: 0px;
    bottom: -1px;
    height: 1px;
    pointer-events: none;
  }

  .open-tabs .bottom-border-shadow {
    opacity: 1;
    z-index: 500;
    box-shadow: 0px -1px 4px rgba(55, 84, 170, 0.1);
    clip-path: inset(-10px -10px 1px -10px);
  }
</style>
