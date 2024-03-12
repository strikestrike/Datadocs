<script lang="ts">
  import { getContext } from "svelte";
  import type { MetaRun } from "@datadocs/canvas-datagrid-ng";
  import HyperlinkControlButton from "./HyperlinkControlButton.svelte";
  import Icon from "../../../common/icons/Icon.svelte";
  import { copyAction } from "../../../common/copy-action";
  import { CLOSE_LAYOVER_MENU_CONTEXT } from "../../layover-menus/constant";
  import {
    beginEdit,
    checkCellOnEditting,
    editLinkAt,
    endEdit,
    hasGridEditor,
    selectLinkAt,
    removeEditorLinkAt,
  } from "../../../../app/store/store-toolbar";
  import { getGrid } from "../../../../app/store/grid/base";
  import { transformToHttpUrl } from "@datadocs/canvas-datagrid-ng/lib/utils/hyperlink";
  import LoadImage from "../../../common/load-image/LoadImage.svelte";

  export let gridCellRowIndex: number;
  export let gridCellColumnIndex: number;
  export let linkRun: MetaRun;
  export let readonly = false;
  export let handleRemoveLink = (linkRun: MetaRun) => {};
  // export let linkIndex: number;

  const closeLayoverMenu: () => void = getContext(CLOSE_LAYOVER_MENU_CONTEXT);
  // const label = value.slice(linkRun.startOffset, linkRun.endOffset);

  let copyButtonElement: HTMLElement;
  let isFaviconLoaded = false;
  let isFaviconSuccess = false;
  let isFaviconValid = false;
  let faviconImage: HTMLImageElement;

  function onControlButtonClick() {
    if (typeof closeLayoverMenu === "function") {
      closeLayoverMenu();
    }
  }

  function onCopySuccess() {
    onControlButtonClick();
  }

  function editLink() {
    const isCellOnEditing = checkCellOnEditting(
      gridCellRowIndex,
      gridCellColumnIndex
    );
    if (!isCellOnEditing) {
      if (hasGridEditor()) {
        // close grid active editor before opening a new one
        endEdit(true);
      }
      beginEdit(gridCellRowIndex, gridCellColumnIndex, false);
    }
    selectLinkAt(linkRun.startOffset);

    const grid = getGrid();
    grid.input.updateEditorStyle(true);

    // TODO: Find out why child element inside editor get wrong client rect. It might
    // be from some later changes that make the editor style changed. Temporarily use
    // timeout to make sure grid editor ready.
    const hasEditor = hasGridEditor();
    if (hasEditor && !isCellOnEditing) {
      grid.input.style.opacity = "0";
    }

    setTimeout(() => {
      onControlButtonClick();
      editLinkAt(linkRun.startOffset);
      if (hasEditor && !isCellOnEditing) {
        getGrid().input.style.opacity = "unset";
      }
    });
  }

  /**
   * Remove the link run. If there is an editor open, it means we are using grid
   * editor, otherwise make change directly to cell meta
   */
  function removeLink() {
    if (hasGridEditor()) {
      removeEditorLinkAt(linkRun.startOffset);
    } else {
      handleRemoveLink(linkRun);
    }
    onControlButtonClick();
  }

  function getFaviconImageUrl(url: string, size = 64) {
    url = transformToHttpUrl(url);
    return `https://www.google.com/s2/favicons?domain=${url}&sz=${size}`;
  }

  /**
   * Check if the favicon iamge is a valid one because the api will return a fallback
   * image if not found.
   * @param image
   */
  function checkFaviconImageValid(image: HTMLImageElement) {
    const fallbackImageSize = 16;
    return (
      image &&
      (image.naturalWidth > fallbackImageSize ||
        image.naturalHeight > fallbackImageSize)
    );
  }

  $: ref = linkRun.ref;
  $: if (isFaviconLoaded && isFaviconSuccess && faviconImage) {
    isFaviconValid = checkFaviconImageValid(faviconImage);
  }
</script>

<div class="flex flex-row items-top">
  <!-- Try to load the image beforehand to see if it's a valid one or not -->
  <LoadImage
    imageUrl={getFaviconImageUrl(ref)}
    bind:isLoaded={isFaviconLoaded}
    bind:isSuccess={isFaviconSuccess}
    bind:imageElement={faviconImage}
  />

  <div class="site-info w-[200px] flex flex-row items-center gap-2">
    <div
      class="text-dark-100 flex-shrink-0 flex-grow-0 w-4.5 h-4.5 rounded-sm overflow-hidden"
    >
      {#if !isFaviconValid}
        <Icon icon="hyperlink-favicon" size="18px" />
      {:else}
        <img
          style="height: 100%; width: 100%; object-fit: contain;"
          src={getFaviconImageUrl(ref)}
          alt="favicon"
        />
      {/if}
    </div>

    <div class="site-url">
      <a href={transformToHttpUrl(ref)} target="_blank">{ref}</a>
    </div>
    <!-- <div class="text-13px text-primary-indigo-blue">{ref}</div>
    <div class="text-13px text-primary-indigo-blue">{ref}</div> -->
  </div>

  <div class="control-group flex flex-row items-centers">
    <div
      bind:this={copyButtonElement}
      use:copyAction={{
        content: ref,
        onSuccess: onCopySuccess,
        onError: null,
      }}
    >
      <HyperlinkControlButton icon="hyperlink-copy" tooltip="Copy link" />
    </div>

    <HyperlinkControlButton
      icon="hyperlink-edit"
      tooltip="Edit link"
      disabled={readonly}
      on:click={() => {
        if (!readonly) {
          editLink();
        }
      }}
    />

    <HyperlinkControlButton
      icon="hyperlink-remove"
      tooltip="Remove link"
      disabled={readonly}
      on:click={() => {
        if (!readonly) {
          removeLink();
        }
      }}
    />
  </div>
</div>

<style lang="postcss">
  /* .site-info {
    font-family: Roboto;
  } */

  .site-url {
    @apply text-13px font-medium text-[blue];
    @apply max-w-full overflow-x-hidden overflow-ellipsis;
  }

  .site-url a {
    white-space: nowrap;
  }
</style>
