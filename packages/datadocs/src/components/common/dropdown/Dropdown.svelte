<script lang="ts">
  import { onDestroy, onMount, setContext } from "svelte";
  import dragAction from "../../../layout/helpers/drag-action/drag-action";
  import type {
    DragActionOptions,
    PointerPosition,
  } from "../../../layout/helpers/drag-action/types";
  import Icon from "../icons/Icon.svelte";
  import {
    CLOSE_DROPDOWN_CONTEXT_NAME,
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME,
  } from "./constant";
  import type {
    DropdownCustomSize,
    DropdownResizeType,
    DropdownTriggerRect,
  } from "./type";

  export let wrapperElement: HTMLElement;
  export let triggerElement: HTMLElement = undefined;
  export let triggerRect: DropdownTriggerRect;
  export let position:
    | "top-bottom"
    | "left-right"
    | "top"
    | "bottom"
    | "left"
    | "right" = "top-bottom";
  export let alignment: "left" | "right" = "left";
  export let distanceToDropdown: number = 4; // the distance from the trigger to the dropdown (px)
  export let distanceToEdge: number = 8; // the distance from the dropdown to the edge of the screen (px)
  export let closeOnMouseDownOutside: boolean = true;
  export let closeOnMouseClickOutside: boolean = false;
  export let closeOnEscapeKey: boolean = true;
  export let width: number = -1;
  /**
   * Setting width of the dropdown content based on the button element
   * automatically. And the prop `width` will be ignored if this prop is `true`.
   */
  export let autoWidth = false;
  /**
   * If `true`, the width is based on dropdown content.  When used with
   * {@link autoWidth}, the minimum width will be the same as the trigger
   * element width, however, if the content is larger than that, the content
   * width will be preferred.
   *
   * Don't use it with {@link resize}.
   */
  export let dynamicWidth = false;
  /**
   * Allow the dropdown children to freely manipulate the height of the dropdown
   * without needing to call {@link updateDropdownPosition} while still
   * constraining the dropdown height to the total window height.
   */
  export let freeFormHeight = false;
  export let freeFormWidth = false;
  /**
   * Allow the dropdown to be resized. Also consider setting {@link width} to
   * a certain value which we will use as the minimum width when resizing
   * vertically if the children will not use {@link customSize} to match the
   * parent size.
   */
  export let resize: DropdownResizeType = "none";
  export let customSize: DropdownCustomSize = undefined;
  export let isMoreButtonDropdown: boolean = false;
  export let onClose: () => any = undefined;

  setContext(CLOSE_DROPDOWN_CONTEXT_NAME, notifyCloseDropdown);
  setContext(UPDATE_DROPDOWN_STYLE_CONTEXT_NAME, forceUpdateDropdownStyle);

  let dropdownElement: HTMLElement;
  let dropdownIconElement: HTMLElement;

  let dropdownTop: number;
  let dropdownLeft: number;
  let dropdownHeight: number;
  let dropdownWidth: number;
  let dropdownMaxHeight: number;

  function addListeners() {
    if (closeOnMouseDownOutside) {
      document.body.addEventListener("mousedown", handleMousedownOutside);
    }
    if (closeOnMouseClickOutside) {
      document.body.addEventListener("click", handleMousedownOutside, true);
    }
    document.body.addEventListener("keydown", handleCloseDropdownOnEscapeKey);
    window.addEventListener("resize", handleDropdownResize);
  }

  function removeListeners() {
    if (closeOnMouseDownOutside) {
      document.body.removeEventListener("mousedown", handleMousedownOutside);
    }
    if (closeOnMouseClickOutside) {
      document.body.removeEventListener("click", handleMousedownOutside, true);
    }
    document.body.removeEventListener(
      "keydown",
      handleCloseDropdownOnEscapeKey,
    );
    window.removeEventListener("resize", handleDropdownResize);
  }

  function notifyCloseDropdown() {
    if (onClose) onClose();
  }

  function handleMousedownOutside(event: Event) {
    const target = event.target;
    if (target instanceof Node && wrapperElement?.contains(target)) return;
    notifyCloseDropdown();
  }

  function handleCloseDropdownOnEscapeKey(event: KeyboardEvent) {
    if (closeOnEscapeKey && event.key === "Escape") {
      notifyCloseDropdown();
    }
  }

  function handleDropdownClose() {
    removeListeners();
  }

  function handleDropdownOpen(shapeChanged: boolean = false) {
    updateDropdownPosition(shapeChanged);
    setTimeout(() => {
      addListeners();
    });
  }

  function handleDropdownResize() {
    updateDropdownPosition();
  }

  function forceUpdateDropdownStyle() {
    if (!dropdownElement) return;

    // Allow updating if the user is not interacting with the resize handle.
    const dropdownStyle = {
      top: "unset",
      left: "unset",
      height: "unset",
      width: "unset",
      maxHeight: "unset",
      maxWidth: "unset",
    };
    Object.assign(dropdownElement.style, dropdownStyle);

    updateDropdownPosition(true);
  }

  let initDropdownHeight: number = 0;
  let initDropdownWidth: number = 0;

  let dragResizeContext: {
    pos: PointerPosition;
    originalBounds: { width: number; height: number };
  } = undefined;

  function updateDropdownPosition(shapeChanged: boolean = false) {
    if (!triggerRect) return;
    if (dynamicWidth) dropdownElement.style.width = "unset";

    const triggerBound = triggerElement?.getBoundingClientRect() ?? triggerRect;
    const dropdownBound = dropdownElement.getBoundingClientRect();
    const dropdownIconBound = dropdownIconElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const customWidth =
      customSize && (resize === "horizontal" || resize === "both")
        ? customSize.width
        : -1;
    const customHeight =
      customSize && (resize === "vertical" || resize === "both")
        ? customSize.height
        : -1;

    if (shapeChanged) {
      initDropdownHeight = dropdownBound.height;
      initDropdownWidth = dropdownBound.width;
    }

    if (autoWidth && triggerBound.width !== undefined) {
      dropdownWidth = Math.max(triggerBound.width, initDropdownWidth);
    } else if (width > 0 || customWidth > 0) {
      dropdownWidth = Math.min(
        Math.max(width, customWidth, initDropdownWidth),
        windowWidth - 2 * distanceToEdge,
      );
    } else {
      dropdownWidth = initDropdownWidth;
    }

    const targetHeight = Math.max(initDropdownHeight, customHeight);

    if (
      position === "top-bottom" ||
      position === "top" ||
      position === "bottom"
    ) {
      let dropdownPostion: "top" | "bottom";
      if (position === "top-bottom") {
        const distanceToTop = triggerBound.top;
        const distanceToBottom = windowHeight - triggerBound.bottom;
        dropdownPostion = distanceToBottom >= distanceToTop ? "bottom" : "top";
      } else {
        dropdownPostion = position;
      }

      if (alignment === "left") {
        dropdownLeft = Math.round(
          Math.min(
            triggerBound.left,
            Math.max(windowWidth - dropdownWidth - distanceToEdge, 0),
          ),
        );
      } else {
        dropdownLeft = Math.round(
          Math.max(
            Math.min(triggerBound.right, windowWidth) - dropdownWidth,
            distanceToEdge,
          ),
        );
      }

      if (dropdownPostion === "bottom") {
        dropdownTop = Math.round(triggerBound.bottom + distanceToDropdown);
        dropdownMaxHeight = Math.round(
          windowHeight - dropdownTop - distanceToEdge,
        );
        dropdownHeight = Math.round(Math.min(dropdownMaxHeight, targetHeight));
      } else {
        dropdownMaxHeight = Math.round(
          triggerBound.top - distanceToDropdown - distanceToEdge,
        );
        dropdownHeight = Math.round(Math.min(dropdownMaxHeight, targetHeight));
        dropdownTop = Math.round(
          triggerBound.top - distanceToDropdown - dropdownHeight,
        );
      }
    } else {
      let dropdownPosition: "right" | "left";
      // prefer right over left, can be overlapped
      if (position === "left-right") {
        const distanceToLeft = triggerBound.left;
        const distanceToRight = windowWidth - triggerBound.right;
        dropdownPosition =
          distanceToRight >= distanceToLeft ||
          distanceToRight > dropdownWidth + distanceToDropdown + distanceToEdge
            ? "right"
            : "left";
      } else {
        dropdownPosition = position;
      }

      dropdownMaxHeight = windowHeight - distanceToEdge;
      dropdownHeight = Math.round(Math.min(dropdownMaxHeight, targetHeight));
      dropdownTop =
        dropdownHeight > windowHeight - triggerBound.top - distanceToEdge
          ? windowHeight - dropdownHeight - distanceToEdge
          : triggerBound.top;

      if (dropdownPosition === "right") {
        dropdownLeft = Math.round(
          Math.min(
            triggerBound.right + distanceToDropdown,
            Math.max(
              windowWidth - distanceToDropdown - dropdownWidth - distanceToEdge,
              0,
            ),
          ),
        );
      } else {
        dropdownLeft = Math.round(
          Math.min(
            Math.max(triggerBound.left - distanceToDropdown - dropdownWidth, 0),
            Math.max(
              windowWidth - distanceToDropdown - dropdownWidth - distanceToEdge,
              0,
            ),
          ),
        );
      }
    }

    const dropdownIconStyle = {
      top: triggerBound.bottom + 6 + "px",
      left:
        Math.round(
          (triggerBound.left + triggerBound.right) / 2 -
            dropdownIconBound.width / 2,
        ) + "px",
    };

    const allowAutoHeight = customHeight < 0 && freeFormHeight;
    const allowAutoWidth = customWidth < 0 && width < 0 && freeFormWidth;
    const dropdownStyle = {
      top: dropdownTop + "px",
      left: dropdownLeft + "px",
      height: allowAutoHeight ? "auto" : dropdownHeight + "px",
      width: allowAutoWidth ? "auto" : dropdownWidth + "px",
      minWidth:
        (autoWidth && (dynamicWidth || freeFormWidth)
          ? Math.min(triggerBound.width, windowWidth)
          : 0) + "px",
      maxHeight: dropdownMaxHeight + "px",
      maxWidth: windowWidth + "px",
    };

    // Ensure the custom size does not exceed the available space.
    if (
      customSize &&
      (dropdownWidth !== customWidth || dropdownHeight !== customHeight)
    ) {
      customSize = {
        ...customSize,
        width: dropdownWidth,
        height: dropdownHeight,
      };
    }

    Object.assign(dropdownElement.style, dropdownStyle);
    Object.assign(dropdownIconElement.style, dropdownIconStyle);
  }

  onMount(() => {
    handleDropdownOpen(true);
  });

  onDestroy(() => {
    handleDropdownClose();
  });

  const resizeDragActionOptions: DragActionOptions = {
    onDragStartedCallback(pos) {
      const { width, height } = dropdownElement.getBoundingClientRect();
      dragResizeContext = { pos, originalBounds: { width, height } };
      forceUpdateDropdownStyle();
      return true;
    },
    onDragCallback(newPos) {
      if (!dragResizeContext) return false;
      const { pos, originalBounds } = dragResizeContext;
      customSize = {
        width: originalBounds.width + (newPos.x - pos.x),
        height: originalBounds.height + (newPos.y - pos.y),
      };
      updateDropdownPosition();
      return true;
    },
    onDragEndedCallback() {
      dragResizeContext = undefined;
      forceUpdateDropdownStyle();
    },
  };

  const dropdownIconImage = `
      <svg width="22" height="17" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.39782 1.14436C7.19769 0.0738107 8.80231 0.0738117 9.60218 1.14437L15.1376 8.55292C16.123 9.87184 15.1818 11.75 13.5354 11.75H2.46464C0.818222 11.75 -0.122997 9.87184 0.862452 8.55291L6.39782 1.14436Z" fill="white"/>
      </svg>
    `;

  $: if (triggerRect && dropdownElement) updateDropdownPosition();
</script>

<div
  bind:this={dropdownElement}
  class="dropdown-container"
  class:more-buton={isMoreButtonDropdown}
  class:resizable={resize !== "none"}
  class:free-form-height={freeFormHeight}
  style={width > 0 ? `width: ${width}px;` : ""}
  data-dd-subtoolbar-no-draggable="true"
>
  <slot name="content" />

  <div bind:this={dropdownIconElement} class="fixed z-10">
    {#if isMoreButtonDropdown}
      {@html dropdownIconImage}
    {/if}
  </div>

  {#if resize !== "none"}
    <button use:dragAction={resizeDragActionOptions} class="resize-handle">
      <Icon icon="dropdown-resize" />
    </button>
  {/if}
</div>

<style lang="postcss">
  .dropdown-container {
    @apply fixed inline-block bg-transparent z-2070;

    &.more-buton {
      @apply z-2060;
    }

    &.free-form-height {
      @apply inline-flex flex-col;
    }

    button.resize-handle {
      @apply absolute p-0.5 text-light-100 bg-white rounded;
      cursor: se-resize;
      bottom: 0px;
      right: 0px;
    }

    button.resize-handle:hover {
      @apply text-dark-50;
    }
  }
</style>
