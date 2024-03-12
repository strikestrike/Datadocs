<script context="module" lang="ts">
  import type {
    ComponentProps,
    ComponentType,
  } from "svelte";
  type ResizeModalPosition =
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-right"
    | "bottom-left";

  function getValueInRange(value: number, min: number, max: number) {
    if (value < min) {
      value = min;
    } else if (value > max) {
      value = max;
    }

    return value;
  }
</script>

<script lang="ts">
  import { setContext, onDestroy, tick, onMount } from "svelte";
  import type { Writable } from "svelte/store";
  import {
    CLOSE_MODAL_CONTEXT_NAME,
    defaultModalConfigType,
    defaultModalMinHeight,
    defaultModalMinWidth,
    MOVE_MODAL_ACTION_CONTEXT_NAME,
  } from "./type";
  import type { ModalConfigType } from "./type";
  import { fade } from "svelte/transition";
  import { scaleUp } from "./transition";

  export let modalConfigStore: Writable<ModalConfigType<any>>;
  export let backgroundStyle = "background: #454450; opacity: 0.6;";

  const scaleUpFrom = 0.8;
  const animationDuration = 80;
  let modalContainer: HTMLElement;
  let modalComponent: ComponentType;
  let modalProps: ComponentProps<any>;
  let isMovable = false;
  let isResizable = false;
  let width = defaultModalMinWidth;
  let minWidth = defaultModalMinWidth;
  let height = defaultModalMinHeight;
  let minHeight = defaultModalMinHeight;
  let isInit = false;
  let previousWindowWidth: number;
  let previousWindowHeight: number;

  function centerModalPosition(onAttachModal: boolean) {
    if (!modalContainer) {
      return;
    }

    const ratio = onAttachModal ? 1 / scaleUpFrom : 1; // adjust the size of modal as get in with animation
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const modalContainerBound = modalContainer.getBoundingClientRect();
    const modalLeft = Math.round(
      Math.max(0, (windowWidth - modalContainerBound.width * ratio) / 2)
    );
    const modalTop = Math.round(
      Math.max(0, (windowHeight - modalContainerBound.height * ratio) / 3)
    );

    const modalStyle = {
      left: modalLeft + "px",
      top: modalTop + "px",
    };

    Object.assign(modalContainer.style, modalStyle);
  }

  function updateModalPositionOnResize() {
    if (!isMovable && !isResizable) {
      centerModalPosition(false);
      return;
    }

    if (!modalContainer) {
      return;
    }

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const { top, bottom, right, left } = modalContainer.getBoundingClientRect();
    const deltaWidth = previousWindowWidth - windowWidth;
    const deltaHeight = previousWindowHeight - windowHeight;

    if (deltaWidth > 0 && right > windowWidth) {
      const newLeft = Math.max(
        left - Math.min(deltaWidth, right - windowWidth),
        0
      );
      modalContainer.style.left = newLeft + "px";
    }

    if (deltaHeight > 0 && bottom > windowHeight) {
      const newTop = Math.max(
        top - Math.min(deltaHeight, bottom - windowHeight),
        0
      );
      modalContainer.style.top = newTop + "px";
    }

    previousWindowWidth = windowWidth;
    previousWindowHeight = windowHeight;
  }

  function closeModal() {
    const onClose = modalConfig?.onClose;
    modalConfigStore.set(null);
    if (onClose) onClose();
  }

  function handleWindowResize() {
    updateModalPositionOnResize();
  }

  async function handleAttachModal() {
    if (isInit) {
      return;
    }

    window.addEventListener("resize", handleWindowResize);
    previousWindowWidth = window.innerWidth;
    previousWindowHeight = window.innerHeight;
    isInit = true;

    await tick();
    // let bound = modalContainer.getBoundingClientRect();
    // width = bound.width;
    // height = bound.height;
    centerModalPosition(true);
  }

  function handleRemoveModal() {
    window.removeEventListener("resize", handleWindowResize);
    isInit = false;
  }

  onDestroy(() => {
    window.removeEventListener("resize", handleWindowResize);
  });

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  $: modalConfig = Object.assign({}, defaultModalConfigType, $modalConfigStore);
  $: if (modalConfig) {
    modalComponent = modalConfig.component;
    modalProps = modalConfig.props;
    isResizable = modalConfig.isResizable;
    isMovable = modalConfig.isMovable;
    width = modalConfig.preferredWidth;
    height = modalConfig.preferredHeight;
    minWidth = modalConfig.minWidth;
    minHeight = modalConfig.minHeight;
  } else {
    modalComponent = null;
    modalProps = {};
    isResizable = false;
    isMovable = false;
    width = minWidth = undefined;
    height = minHeight = undefined;
  }
  $: if (modalContainer) {
    if (!isInit) {
      handleAttachModal();
    }
  } else {
    handleRemoveModal();
  }

  function handleClickOutside() {
    if (modalConfig.allowOutsideClick) closeModal();
  }
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (modalConfig.allowEscapeKey) closeModal();
    }
  }

  function moveModalAction(triggerElement: HTMLElement) {
    let mouseToTopDistance = 0;
    let mouseToBottomDistance = 0;
    let mouseToLeftDistance = 0;
    let mouseToRightDistance = 0;
    let isDragging = false;

    function startDragging(event: MouseEvent) {
      if (!modalContainer) {
        return;
      }

      const { clientX, clientY } = event;
      const { top, bottom, left, right } =
        modalContainer.getBoundingClientRect();

      mouseToLeftDistance = clientX - left;
      mouseToRightDistance = right - clientX;
      mouseToTopDistance = clientY - top;
      mouseToBottomDistance = bottom - clientY;
      isDragging = true;
    }

    function handleDrag(event: MouseEvent) {
      if (!isDragging || !modalContainer) {
        return;
      }

      const bound = modalContainer.getBoundingClientRect();
      const { clientX, clientY } = event;
      let left: number, top: number;

      // left postion
      const minLeft = 0;
      const maxLeft = Math.max(window.innerWidth - bound.width, bound.left);
      left = clientX - mouseToLeftDistance;
      left = getValueInRange(left, minLeft, maxLeft);

      // top postion
      const minTop = 0;
      const maxTop = Math.max(window.innerHeight - bound.height, bound.top);
      top = clientY - mouseToTopDistance;
      top = getValueInRange(top, minTop, maxTop);

      Object.assign(modalContainer.style, {
        top: top + "px",
        left: left + "px",
      });
    }

    function stopDragging() {
      isDragging = false;
    }

    function handleMouseDown(event: MouseEvent) {
      if (!isMovable) {
        return;
      }

      const target = event.target as HTMLElement;
      if (target !== triggerElement) {
        return;
      }

      document.addEventListener("mousemove", handleMouseMove, true);
      document.addEventListener("mouseup", handleMouseUp);
      startDragging(event);
    }

    function handleMouseUp() {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp);
      stopDragging();
    }

    function handleMouseMove(event: MouseEvent) {
      event.preventDefault(); // prevent selecting text in modal while dragging
      handleDrag(event);
    }

    triggerElement.addEventListener("mousedown", handleMouseDown);

    return {
      destroy() {
        triggerElement.removeEventListener("mousedown", handleMouseDown);
      },
    };
  }

  function resizeModalAction(
    triggerElement: HTMLElement,
    config: { type: ResizeModalPosition }
  ) {
    let mouseXStart: number;
    let mouseYStart: number;
    let startHeight: number;
    let startWidth: number;
    let startTop: number;
    let startBottom: number;
    let startLeft: number;
    let startRight: number;
    let isResizing = false;

    function startResizing(event: MouseEvent) {
      if (!modalContainer) {
        return;
      }
      const { top, bottom, left, right, width, height } =
        modalContainer.getBoundingClientRect();

      mouseXStart = event.clientX;
      mouseYStart = event.clientY;
      startHeight = height;
      startWidth = width;
      startTop = top;
      startBottom = bottom;
      startLeft = left;
      startRight = right;
      isResizing = true;
    }

    function handleResize(event: MouseEvent) {
      if (!isResizing || !modalContainer) {
        return;
      }

      let { clientX, clientY } = event;
      clientX = getValueInRange(clientX, 0, window.innerWidth);
      clientY = getValueInRange(clientY, 0, window.innerHeight);

      if (
        config.type === "top" ||
        config.type === "top-left" ||
        config.type === "top-right"
      ) {
        const maxHeight = startBottom;
        const deltaY = mouseYStart - clientY;
        let newHeight = startHeight + deltaY;
        newHeight = Math.min(newHeight, maxHeight);
        newHeight = Math.max(newHeight, minHeight);
        const newTop = startBottom - newHeight;

        Object.assign(modalContainer.style, {
          top: newTop + "px",
          height: newHeight + "px",
        });
      }

      if (
        config.type === "bottom" ||
        config.type === "bottom-left" ||
        config.type === "bottom-right"
      ) {
        const maxHeight = window.innerHeight - startTop;
        const deltaY = clientY - mouseYStart;
        let newHeight = startHeight + deltaY;
        newHeight = Math.min(newHeight, maxHeight);
        newHeight = Math.max(newHeight, minHeight);

        Object.assign(modalContainer.style, {
          height: newHeight + "px",
        });
      }

      if (
        config.type === "left" ||
        config.type === "top-left" ||
        config.type === "bottom-left"
      ) {
        const maxWidth = startRight;
        const deltaX = mouseXStart - clientX;
        let newWidth = startWidth + deltaX;
        newWidth = Math.min(newWidth, maxWidth);
        newWidth = Math.max(newWidth, minWidth);
        const newLeft = startRight - newWidth;

        Object.assign(modalContainer.style, {
          left: newLeft + "px",
          width: newWidth + "px",
        });
      }

      if (
        config.type === "right" ||
        config.type === "top-right" ||
        config.type === "bottom-right"
      ) {
        const maxWidth = window.innerWidth - startLeft;
        const deltaX = clientX - mouseXStart;
        let newWidth = startWidth + deltaX;
        newWidth = Math.min(newWidth, maxWidth);
        newWidth = Math.max(newWidth, minWidth);
        Object.assign(modalContainer.style, {
          width: newWidth + "px",
        });
      }
    }

    function stopResizing() {
      isResizing = false;
    }

    function handleMouseMove(event: MouseEvent) {
      event.preventDefault(); // prevent selecting text in modal while dragging
      handleResize(event);
    }

    function handleMouseUp() {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp);
      stopResizing();
    }

    function handleMouseDown(event: MouseEvent) {
      document.addEventListener("mousemove", handleMouseMove, true);
      document.addEventListener("mouseup", handleMouseUp);
      startResizing(event);
    }

    triggerElement.addEventListener("mousedown", handleMouseDown);

    return {
      destroy() {
        triggerElement.removeEventListener("mousedown", handleMouseDown);
      },
    };
  }

  setContext(CLOSE_MODAL_CONTEXT_NAME, closeModal);
  setContext(MOVE_MODAL_ACTION_CONTEXT_NAME, moveModalAction);
</script>

{#if modalComponent}
  <div
    class="modal-container fixed left-0 right-0 top-0 bottom-0 bg-transparent z-10000"
  >
    {#if modalConfig.hasBackdrop}
      <div
        in:fade={{ duration: animationDuration }}
        style={backgroundStyle}
        class="w-full h-full"
        aria-label="backdrop"
        on:click={handleClickOutside}
        on:keypress={handleKeyDown}
      />
    {/if}

    <div
      in:scaleUp={{ duration: animationDuration, from: scaleUpFrom }}
      bind:this={modalContainer}
      class="absolute"
      style="min-width: {minWidth}px; min-height: {minHeight}px; width: {width
        ? width + 'px'
        : 'unset'}; height: {height ? height + 'px' : 'unset'}"
    >
      <svelte:component this={modalComponent} {...modalProps} />

      {#if isResizable}
        <div class="top-resize-bar" use:resizeModalAction={{ type: "top" }} />

        <div
          class="bottom-resize-bar"
          use:resizeModalAction={{ type: "bottom" }}
        />

        <div class="left-resize-bar" use:resizeModalAction={{ type: "left" }} />

        <div
          class="right-resize-bar"
          use:resizeModalAction={{ type: "right" }}
        />

        <!-- top left corner -->
        <div
          class="top-left-horizontal-resize-bar"
          use:resizeModalAction={{ type: "top-left" }}
        />

        <div
          class="top-left-vertical-resize-bar"
          use:resizeModalAction={{ type: "top-left" }}
        />

        <!-- top right corner -->
        <div
          class="top-right-horizontal-resize-bar"
          use:resizeModalAction={{ type: "top-right" }}
        />

        <div
          class="top-right-vertical-resize-bar"
          use:resizeModalAction={{ type: "top-right" }}
        />

        <!-- bottom right corner -->
        <div
          class="bottom-right-horizontal-resize-bar"
          use:resizeModalAction={{ type: "bottom-right" }}
        />

        <div
          class="bottom-right-vertical-resize-bar"
          use:resizeModalAction={{ type: "bottom-right" }}
        />

        <!-- bottom left corner -->
        <div
          class="bottom-left-horizontal-resize-bar"
          use:resizeModalAction={{ type: "bottom-left" }}
        />

        <div
          class="bottom-left-vertical-resize-bar"
          use:resizeModalAction={{ type: "bottom-left" }}
        />
      {/if}
    </div>
  </div>
{/if}

<style lang="postcss">
  .modal-container :global(*) {
    @apply select-text;
  }

  .top-resize-bar {
    @apply absolute left-0 right-0 z-10;
    height: 4px;
    top: -2px;
    cursor: ns-resize;
    /* background-color: red; */
  }

  .bottom-resize-bar {
    @apply absolute left-0 right-0 z-10;
    height: 4px;
    bottom: -2px;
    cursor: ns-resize;
    /* background-color: red; */
  }

  .left-resize-bar {
    @apply absolute top-0 bottom-0 z-10;
    width: 4px;
    left: -2px;
    cursor: ew-resize;
    /* background-color: yellow; */
  }

  .right-resize-bar {
    @apply absolute top-0 bottom-0 z-10;
    width: 4px;
    right: -2px;
    cursor: ew-resize;
    /* background-color: yellow; */
  }

  /* top left corner */
  .top-left-horizontal-resize-bar {
    @apply absolute z-20;
    top: -2px;
    left: -2px;
    width: 10px;
    height: 4px;
    cursor: nwse-resize;
    /* background-color: blue; */
  }

  .top-left-vertical-resize-bar {
    @apply absolute z-20;
    top: -2px;
    left: -2px;
    width: 4px;
    height: 10px;
    cursor: nwse-resize;
    /* background-color: blue; */
  }

  /* top right corner */
  .top-right-horizontal-resize-bar {
    @apply absolute z-20;
    top: -2px;
    right: -2px;
    width: 10px;
    height: 4px;
    cursor: nesw-resize;
    /* background-color: blue; */
  }

  .top-right-vertical-resize-bar {
    @apply absolute z-20;
    top: -2px;
    right: -2px;
    width: 4px;
    height: 10px;
    cursor: nesw-resize;
    /* background-color: blue; */
  }

  /* bottom right corner */
  .bottom-right-horizontal-resize-bar {
    @apply absolute z-20;
    bottom: -2px;
    right: -2px;
    width: 10px;
    height: 4px;
    cursor: nwse-resize;
    /* background-color: blue; */
  }

  .bottom-right-vertical-resize-bar {
    @apply absolute z-20;
    bottom: -2px;
    right: -2px;
    width: 4px;
    height: 10px;
    cursor: nwse-resize;
    /* background-color: blue; */
  }

  /* bottom left corner */
  .bottom-left-horizontal-resize-bar {
    @apply absolute z-20;
    bottom: -2px;
    left: -2px;
    width: 10px;
    height: 4px;
    cursor: nesw-resize;
    /* background-color: blue; */
  }

  .bottom-left-vertical-resize-bar {
    @apply absolute z-20;
    bottom: -2px;
    left: -2px;
    width: 4px;
    height: 10px;
    cursor: nesw-resize;
    /* background-color: blue; */
  }
</style>
