<!-- @component
@packageDocumentation
@module components/RootContextMenuWrapper
-->
<script lang="ts">
  import { onDestroy } from "svelte";
  import type { ContextMenuPosition } from "./type";

  export let show = false;
  export let position: "top-bottom" | "left-right" = "top-bottom";
  export let preferPosition: ContextMenuPosition = "";
  export let alignment: "left" | "right" = "left";
  export let distanceToDropdown = 4; // the distance from the trigger to the dropdown (px)
  export let distanceToEdge = 8; // the distance from the dropdown to the edge of the screen (px)
  export let triggerElement: HTMLElement;
  export let isAtMousePosition = false;
  export let mouseX: number;
  export let mouseY: number;

  let dropdownElement: HTMLElement;

  let dropdownTop: number;
  let dropdownLeft: number;
  let dropdownHeight: number;
  let dropdownMaxHeight: number;

  function addListeners() {
    window.addEventListener("resize", handleWindowResize);
  }

  function removeListeners() {
    window.removeEventListener("resize", handleWindowResize);
  }

  function handleWindowResize() {
    if (!isAtMousePosition) {
      updateDropdownPosition();
    } else {
      putDropdownAtMousePosition(mouseX, mouseY);
    }
  }

  function handleDropdownClose() {
    removeListeners();
  }

  function handleDropdownOpen(shapeChanged = false) {
    if (!isAtMousePosition) {
      updateDropdownPosition(shapeChanged);
    } else {
      putDropdownAtMousePosition(mouseX, mouseY);
    }

    addListeners();
  }

  let initDropdownHeight = 0;
  function updateDropdownPosition(shapeChanged = false) {
    const triggerBound = triggerElement.getBoundingClientRect();
    const dropdownBound = dropdownElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    if (shapeChanged) {
      initDropdownHeight = dropdownBound.height;
    }

    if (position === "top-bottom") {
      const distanceToTop = triggerBound.top;
      const distanceToBottom = windowHeight - triggerBound.bottom;
      const dropdownPostion: "top" | "bottom" = preferPosition
        ? preferPosition
        : distanceToBottom >= distanceToTop
          ? "bottom"
          : "top";

      const dropdownWidth = dropdownBound.width;
      if (alignment === "left") {
        dropdownLeft = Math.round(
          Math.min(
            triggerBound.left,
            Math.max(windowWidth - dropdownWidth - distanceToEdge, 0)
          )
        );
      } else {
        dropdownLeft = Math.round(
          Math.max(
            Math.min(triggerBound.right, windowWidth) - dropdownWidth,
            distanceToEdge
          )
        );
      }

      if (dropdownPostion === "bottom") {
        dropdownTop = Math.round(triggerBound.bottom + distanceToDropdown);
        dropdownMaxHeight = Math.round(
          windowHeight - dropdownTop - distanceToEdge
        );
        dropdownHeight = Math.round(
          Math.min(dropdownMaxHeight, initDropdownHeight)
        );
      } else {
        dropdownMaxHeight = Math.round(
          triggerBound.top - distanceToDropdown - distanceToEdge
        );
        dropdownHeight = Math.round(
          Math.min(dropdownMaxHeight, initDropdownHeight)
        );
        dropdownTop = Math.round(
          triggerBound.top - distanceToDropdown - dropdownHeight
        );
      }
    } else {
      // prefer right over left, can be overlapped
      const distanceToLeft = triggerBound.left;
      const distanceToRight = windowWidth - triggerBound.right;
      const dropdownPosition: "right" | "left" =
        distanceToRight >= distanceToLeft ||
        distanceToRight >
          dropdownBound.width + distanceToDropdown + distanceToEdge
          ? "right"
          : "left";

      dropdownMaxHeight = windowHeight - distanceToEdge;
      dropdownHeight = Math.round(
        Math.min(dropdownMaxHeight, initDropdownHeight)
      );
      dropdownTop =
        dropdownHeight > windowHeight - triggerBound.top - distanceToEdge
          ? windowHeight - dropdownHeight - distanceToEdge
          : triggerBound.top;

      if (dropdownPosition === "right") {
        dropdownLeft = Math.round(
          Math.min(
            triggerBound.right + distanceToDropdown,
            Math.max(
              windowWidth -
                distanceToDropdown -
                dropdownBound.width -
                distanceToEdge,
              0
            )
          )
        );
      } else {
        dropdownLeft = Math.round(
          Math.min(
            Math.max(
              triggerBound.left - distanceToDropdown - dropdownBound.width,
              0
            ),
            Math.max(
              windowWidth -
                distanceToDropdown -
                dropdownBound.width -
                distanceToEdge,
              0
            )
          )
        );
      }
    }

    const dropdownStyle: any = {
      top: dropdownTop + "px",
      left: dropdownLeft + "px",
      height: dropdownHeight + "px",
    };

    Object.assign(dropdownElement.style, dropdownStyle);
  }

  function putDropdownAtMousePosition(mouseX: number, mouseY: number) {
    const dropdownBound = dropdownElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    // Move the element to the left if there isn't enough space on the right.
    dropdownLeft =
      mouseX + dropdownBound.width > windowWidth
        ? Math.max(mouseX - dropdownBound.width, 0)
        : mouseX;
    // Move the element to the top if there isn't enough space at the bottom.
    dropdownTop =
      mouseY + dropdownBound.height > windowHeight
        ? Math.max(mouseY - dropdownBound.height, 0)
        : mouseY;
    // Shorten the height of the element if it isn't going to fully fit the
    // window vertically.
    dropdownHeight =
      dropdownTop + dropdownBound.height > windowHeight
        ? (dropdownHeight = windowHeight)
        : dropdownBound.height;

    const dropdownStyle: any = {
      top: dropdownTop + "px",
      left: dropdownLeft + "px",
      height: dropdownHeight + "px",
    };

    Object.assign(dropdownElement.style, dropdownStyle);
  }

  $: {
    if (dropdownElement) {
      handleDropdownOpen(true);
    } else {
      handleDropdownClose();
    }
  }

  onDestroy(() => {
    removeListeners();
  });
</script>

{#if show}
  <div bind:this={dropdownElement} class="fixed inline-block bg-transparent">
    <slot />
  </div>
{/if}
