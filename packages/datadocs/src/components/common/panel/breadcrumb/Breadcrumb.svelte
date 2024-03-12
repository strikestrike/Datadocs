<script lang="ts">
  import Separator from "./Separator.svelte";
  import type { BreadcrumbItem, BreadcrumbSeparator } from "./type";
  import BreadcrumbHome from "./BreadcrumbHome.svelte";
  import BreadcrumbPath from "./BreadcrumbPath.svelte";
  import BreadcrumbExpand from "./breadscrumb-expand/BreadcrumbExpand.svelte";
  import { watchResize } from "svelte-watch-resize";
  import { estimateElementSize } from "../../../../utils/estimateElementSize";
  import BreadcrumbDropdownItem from "./BreadcrumbDropdownItem.svelte";

  export let home: BreadcrumbItem = null;
  export let dropdownItem: BreadcrumbItem = null;
  export let paths: BreadcrumbItem[] = [];
  export let separator: BreadcrumbSeparator;

  const BREADCRUMB_HOME_SIZE = 16;
  const BREADCRUMB_SEPARATOR_SIZE = 16;
  const BREADCRUMB_EXPAND_SIZE = 21;
  const BREADCRUMB_DROPDOWN_TEXT_SIZE = 24;
  const BREADCRUMB_DROPDOWN_ICON_STYLE_SIZE = 42;

  let breadcrumbElement: HTMLElement;
  let lastPath: BreadcrumbItem;
  let visiblePathsCount = 0;
  let visiblePaths: BreadcrumbItem[] = [];

  function handleBreadcrumbWidthChange() {
    if (!breadcrumbElement) {
      return;
    }

    const maxWidth = breadcrumbElement.getBoundingClientRect().width;
    let totalWidth = BREADCRUMB_HOME_SIZE;
    if (dropdownItem) {
      totalWidth +=
        dropdownItem.shortWidth + BREADCRUMB_DROPDOWN_ICON_STYLE_SIZE;
    }
    for (const path of paths) {
      totalWidth += BREADCRUMB_SEPARATOR_SIZE + path.width;
    }

    if (totalWidth < maxWidth) {
      visiblePathsCount = paths.length;
    } else {
      let currentWidth =
        BREADCRUMB_HOME_SIZE +
        BREADCRUMB_SEPARATOR_SIZE +
        BREADCRUMB_EXPAND_SIZE;

      visiblePathsCount = 0;
      for (let i = paths.length - 1; i >= 0; i--) {
        const blockWidth = BREADCRUMB_SEPARATOR_SIZE + paths[i].width;
        if (currentWidth + blockWidth < maxWidth) {
          visiblePathsCount += 1;
          currentWidth += blockWidth;
        } else {
          break;
        }
      }
    }

    visiblePaths = paths.slice(paths.length - visiblePathsCount, paths.length);
  }

  function handlePathsChange() {
    lastPath = paths[paths.length - 1];
    computePathWidth();
    computeDropdownWithd();
    handleBreadcrumbWidthChange();
  }

  function computeDropdownWithd() {
    if (dropdownItem) {
      const elem = generatePathElement(dropdownItem.name);
      dropdownItem.width = estimateElementSize(elem).width;
      if (paths.length > 0) {
        dropdownItem.shortWidth = BREADCRUMB_DROPDOWN_TEXT_SIZE;
      } else {
        dropdownItem.shortWidth = dropdownItem.width;
      }
    }
  }
  function computePathWidth() {
    paths.forEach((path) => {
      const elem = generatePathElement(path.name);
      path.width = estimateElementSize(elem).width;
    });
  }

  function generatePathElement(value: string) {
    const elem = document.createElement("div");
    Object.assign(elem.style, {
      display: "inline-block",
      padding: "1px",
      fontSize: "12px",
    });
    elem.textContent = value;
    return elem;
  }

  $: paths, handlePathsChange();
</script>

<div
  class="h-full max-w-full whitespace-nowrap overflow-hidden flex flex-row items-center text-12px"
  bind:this={breadcrumbElement}
  use:watchResize={handleBreadcrumbWidthChange}
>
  {#if home}
    <BreadcrumbHome data={home} />
  {/if}

  {#if dropdownItem}
    <BreadcrumbDropdownItem
      data={dropdownItem}
      active={paths.length === 0}
      width={dropdownItem.shortWidth}
    />
  {/if}

  {#if visiblePathsCount < paths.length}
    <Separator data={separator} />
    <BreadcrumbExpand
      {home}
      {dropdownItem}
      {paths}
      {breadcrumbElement}
      {separator}
    />
  {/if}

  {#each visiblePaths as path (path.id)}
    <Separator data={separator} />

    <BreadcrumbPath
      active={lastPath.id === path.id}
      data={path}
      width={path.width}
    />
  {/each}
</div>
