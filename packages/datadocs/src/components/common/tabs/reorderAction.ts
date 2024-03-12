import type { Writable } from "svelte/store";
import { writable } from "svelte/store";

export type ReorderTabOptions<T> = {
  tabs: T[];
  tabListElement: HTMLElement;
  reorderTabs: (newData: T[], activeIndex: number) => void;
};

export const isDraggingReorderTab: Writable<boolean> = writable(false);

export function getReorderTabAction() {
  let isReordering = false;
  let activeIndex = 0;

  return function reorderTabAction<TabData>(
    tabElement: HTMLElement,
    options: ReorderTabOptions<TabData>
  ) {
    let proxyTabElement: HTMLElement = null;
    let mouseToProxyLeft: number;
    let tabsBound: DOMRect[] = [];
    let maxProxyElementLeft: number;
    let minProxyElementLeft: number;
    let { tabs, tabListElement, reorderTabs } = options;

    function addDragProxyElement(mouseX: number, mouseY: number) {
      const { top, left, width, height } = tabElement.getBoundingClientRect();
      const cloneTabElement: HTMLElement = tabElement.cloneNode(
        true
      ) as HTMLElement;
      cloneTabElement.classList.add("tab-proxy");
      proxyTabElement = document.createElement("div");
      proxyTabElement.appendChild(cloneTabElement);

      Object.assign(proxyTabElement.style, {
        position: "absolute",
        left: left + "px",
        top: top + "px",
        width: width + "px",
        height: height + "px",
        zIndex: "999999",
      });

      mouseToProxyLeft = mouseX - left;
      tabElement.classList.add("tab-source");
      document.body.appendChild(proxyTabElement);
    }

    function removeDragProxyElement() {
      if (proxyTabElement) {
        const removeElement = proxyTabElement;
        const { top, left } = tabElement.getBoundingClientRect();

        removeElement.classList.add("tab-removed");
        Object.assign(removeElement.style, {
          left: left + "px",
          top: top + "px",
        });

        setTimeout(() => {
          document.body.removeChild(removeElement);
        }, 80);
      }

      proxyTabElement = null;
      tabElement.classList.remove("tab-source");
    }

    function startReordering(event: MouseEvent) {
      isReordering = true;
      isDraggingReorderTab.set(isReordering);
      activeIndex = parseInt(tabElement.dataset.tabindex);
      addDragProxyElement(event.x, event.y);

      // compute tabs init bounds
      const tabs = tabListElement.children;
      tabsBound = [];
      for (let i = 0; i < tabs.length; i++) {
        const bound = tabs[i].getBoundingClientRect();
        tabsBound.push(bound);
      }

      // compute proxy left min/max
      const tabListElementBound = tabListElement.getBoundingClientRect();
      const lastChildElementBound = tabsBound[tabsBound.length - 1];
      minProxyElementLeft = tabListElementBound.left;
      maxProxyElementLeft = lastChildElementBound.right;

      document.addEventListener("mousemove", reorder);
      document.addEventListener("mouseup", stopReodering);
    }

    function reorder(event: MouseEvent) {
      if (!isReordering) {
        return;
      }

      const mouseX = event.clientX;

      // update proxy tab style
      let left: number = mouseX - mouseToProxyLeft;
      if (
        minProxyElementLeft !== undefined &&
        maxProxyElementLeft !== undefined
      ) {
        left = Math.min(
          Math.max(left, minProxyElementLeft),
          maxProxyElementLeft
        );
      }

      Object.assign(proxyTabElement.style, {
        left: left + "px",
      });

      // update active tab position
      const tabsLength = tabsBound.length;
      let currentTabIndex: number;
      let insertAt: number;

      if (mouseX < tabsBound[0].right) {
        insertAt = 0;
      } else if (mouseX >= tabsBound[tabsLength - 1].left) {
        insertAt = tabsLength - 1;
      } else {
        for (let i = 0; i < tabsLength; i++) {
          if (
            mouseX >= tabsBound[i].left &&
            tabsBound[i + 1] &&
            mouseX < tabsBound[i + 1].left
          ) {
            insertAt = i;
            break;
          }
        }
      }

      for (let i = 0; i < tabListElement.children.length; i++) {
        if (tabElement === tabListElement.children[i]) {
          currentTabIndex = i;
          break;
        }
      }

      if (currentTabIndex !== insertAt) {
        if (insertAt < tabsLength - 1) {
          insertAt = currentTabIndex < insertAt ? insertAt + 1 : insertAt;
          tabListElement.insertBefore(
            tabElement,
            tabListElement.children[insertAt]
          );
        } else {
          tabListElement.appendChild(tabElement);
        }
      }

      event.preventDefault(); // prevent mouse move from select text
    }

    function stopReodering(event: MouseEvent) {
      isReordering = false;
      isDraggingReorderTab.set(isReordering);
      removeDragProxyElement();
      tabsBound = [];
      maxProxyElementLeft = undefined;
      minProxyElementLeft = undefined;

      document.removeEventListener("mousemove", reorder);
      document.removeEventListener("mouseup", stopReodering);

      let active: number;
      const newTabs: TabData[] = [];
      const children = tabListElement.children;
      for (let i = 0; i < children.length; i++) {
        const element = children[i] as HTMLElement;
        const index = parseInt(element.dataset.tabindex);
        newTabs.push(tabs[index]);
        if (activeIndex === index) {
          active = i;
        }
      }

      reorderTabs(newTabs, active);
    }

    function handleMouseDown(event: MouseEvent) {
      if (event.button !== 0) {
        return;
      }

      // not triggerReordering while editing tab name
      if (tabElement.querySelector("input:focus")) {
        return;
      }

      document.addEventListener("mousemove", triggerReordering);
    }

    function handleMouseUp() {
      document.removeEventListener("mousemove", triggerReordering);
    }

    function triggerReordering(event: MouseEvent) {
      event.preventDefault();
      startReordering(event);
      document.removeEventListener("mousemove", triggerReordering);
    }

    tabElement.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return {
      update(newOptions: ReorderTabOptions<TabData>) {
        tabs = newOptions.tabs;
        tabListElement = newOptions.tabListElement;
        reorderTabs = newOptions.reorderTabs;
      },
      destroy() {
        tabElement.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mouseup", handleMouseUp);
      },
    };
  };
}
