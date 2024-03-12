<script lang="ts">
  import { getContext, tick } from "svelte";
  import { getGrid } from "../../../app/store/grid/base";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../common/dropdown";
  import type { DropdownTriggerRect } from "../../common/dropdown/type";

  export let showClosePreviewButton: boolean;
  export let fontFamily: string;
  export let height: number;
  export let fontSize: number;
  export let message: string;
  export let triggerRect: DropdownTriggerRect;

  const updateStyle: () => void = getContext(UPDATE_DROPDOWN_STYLE_CONTEXT_NAME);

  function onClosePreviewClick() {
    const grid = getGrid();
    if (grid) {
      grid.onUserHideCellPreview();
    }
  }

  async function onContentChange() {
    if (typeof updateStyle === 'function') {
      await tick();
      updateStyle();
    }
  }

  $: message, triggerRect, onContentChange();
</script>

<div
  class="relative min-w-1.5 pl-1.5 {showClosePreviewButton
    ? 'pr-0'
    : 'pr-1.5'} select-text cursor-text overflow-hidden overflow-ellipsis whitespace-nowrap"
  style="{fontFamily
    ? `font-family: ${fontFamily};`
    : ''} line-height: {height}px;"
  data-grideditorcompanion="true"
>
  {@html message}
</div>

<button
  class="border-none px-0.5 flex-shrink-0 text-dark-100"
  class:hidden={!showClosePreviewButton}
  data-grideditorcompanion="true"
  on:click={onClosePreviewClick}
>
  <svg
    style="pointer-events: none;"
    width="{fontSize}px"
    height="{fontSize}px"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z"
      fill="currentColor"
    />
  </svg>
</button>
