<script lang="ts">
  import clsx from "clsx";
  import type { Pane } from "src/layout/types/pane";
  import { Split } from "src/layout/enums/split";
  import { getContext } from "svelte";
  import { useLayoutSheet, useLayoutWorkBook } from "src/layout/store/pane";
  import { CONTEXT_TYPE } from "../constants/context";
  import { ContextType } from "../enums/context";
  import type { Type } from "../types/context";
  import { appDnd } from "src/app/core/global/app-dnd";
  import type { DND } from "src/layout/enums/dnd";
  import { useTab } from "./Container/src/ContainerTab/useTab";
  import Drop from "./DragDrop/src/Drop.svelte";
  import { useSplit } from "src/layout/store/split/useSplit";
  import { PANE_CLOSED_SIZE } from "../constants/size";
  import { PANE_MIN_WIDTH } from "../_dprctd/core/constants";

  // only used in SplitEdge component with context
  interface SplitData {
    id: Pane["id"];
    zIndex: number;
    deepLevel: {
      [Split.NORTH_EDGE]: number;
      [Split.SOUTH_EDGE]: number;
      [Split.WEST_EDGE]: number;
      [Split.EAST_EDGE]: number;
    };
    deepMax: {
      [Split.NORTH_EDGE]: number;
      [Split.SOUTH_EDGE]: number;
      [Split.WEST_EDGE]: number;
      [Split.EAST_EDGE]: number;
    };
    children: SplitData[];
  }

  export let pane: Pane;

  export let disabled: boolean = false;

  export let allowDrop: DND[] = [];

  const type = getContext<Type>(CONTEXT_TYPE);
  const {
    getParentById,
    isHGroup,
    isVGroup,
    getSizeById,
    split,
    sync,
    isDashboard,
    isTabGroupDeep,
    resizeChildrenById,
    findFirstChildDeepById,
    isCollapse,
    findLastParentDeepById,
  } = type === ContextType.SHEET ? useLayoutSheet() : useLayoutWorkBook();
  const { createTabFromPane } = useTab();
  const {
    getLevelByPaneIdAndDirection,
    getZIndexByPaneId,
    validSplitByPaneId,
    validDirectionByPaneId,
  } = useSplit();

  const lines = [
    Split.NORTH_EDGE,
    Split.SOUTH_EDGE,
    Split.WEST_EDGE,
    Split.EAST_EDGE,
  ];

  let elementRoot: HTMLElement | null = null;
  let linesFilter = lines;

  $: topCollapse = isCollapse(pane)
    ? findLastParentDeepById(pane.id, (config) => isCollapse(config))
    : null;
  $: parent = getParentById(pane.id);
  $: paneSize = getSizeById(pane.id);
  //   ? getSizeById(
  //       findLastParentDeepById(
  //         pane.id,
  //         (config) => getParentById(config.id)?.id === topCollapse?.id,
  //       )?.id,
  //     )
  //   : getSizeById(pane.id);
  $: paneWidth = isHGroup(parent) === true ? paneSize : `100%`;
  $: paneHeight = isVGroup(parent) === true ? paneSize : "100%";

  $: isDnd = !!$appDnd && allowDrop.includes($appDnd?.action);

  $: canSplit = validSplitByPaneId(pane.id) && !disabled;
  $: {
    if (isDnd) {
      linesFilter = lines.filter((line) => {
        return validDirectionByPaneId(pane.id, line);
      });
    }
  }

  function onSplit(direction) {
    let newPane = $appDnd?.data?.pane;
    if (type === ContextType.WORKBOOK) {
      newPane = createTabFromPane({ pane: $appDnd?.data?.pane });
      newPane.size =
        isDashboard(pane) ||
        direction === Split.WEST_EDGE ||
        direction === Split.EAST_EDGE
          ? "18.46%"
          : "auto";
    }
    split({
      source: newPane,
      targetId: pane.id,
      edge: direction,
    });
    resizeChildrenById(getParentById(pane.id).id);
    sync();
  }

  function useHover(element: HTMLElement) {
    function hover() {
      element.addEventListener("mouseenter", (event) => {
        element.classList.add("hover");
      });
      element.addEventListener("mouseleave", () => {
        element.classList.remove("hover");
      });
    }

    hover();
    return {
      update() {
        hover();
      },
    };
  }

  function computeStyle(line): Partial<CSSStyleDeclaration> {
    const isTopBottom = line === Split.NORTH_EDGE || line === Split.SOUTH_EDGE;
    const offset = 5;
    let offsetLeft =
      ($appDnd?.data?.offsetLeft || 0) +
      getLevelByPaneIdAndDirection(pane.id, Split.WEST_EDGE) +
      offset;
    let offsetRight =
      ($appDnd?.data?.offsetRight || 0) +
      getLevelByPaneIdAndDirection(pane.id, Split.EAST_EDGE) +
      offset;
    let offsetTop =
      ($appDnd?.data?.offsetTop || 0) +
      getLevelByPaneIdAndDirection(pane.id, Split.NORTH_EDGE) +
      offset;
    let offsetBottom =
      ($appDnd?.data?.offsetBottom || 0) +
      getLevelByPaneIdAndDirection(pane.id, Split.SOUTH_EDGE) +
      offset;

    // if pane is tabs group, split line should be half of the pane to forbidden with split line
    if (
      isCollapse(pane) ||
      findFirstChildDeepById(pane.id, (config) => isCollapse(config))
    ) {
      offsetTop = 4;
      offsetBottom = 4;
      offsetLeft = 4;
      offsetRight = 4;
    } else if (isTabGroupDeep(pane)) {
      offsetTop = offset;
      // offsetBottom = offsetBottom / 2;
      offsetLeft = offsetLeft / 2;
      offsetRight = offsetRight / 2;
    }

    let width = offsetLeft + offsetRight;
    let height = offsetTop + offsetBottom;

    let style: any = {
      minWidth: pane?.props?.collapse
        ? `${PANE_CLOSED_SIZE}px`
        : `${PANE_MIN_WIDTH}px`,
    };
    if (isTopBottom) {
      style = {
        width: "100%",
        height: `${height}px`,
        left: "0",
      };
      if (line === Split.NORTH_EDGE) {
        style = {
          ...style,
          top: `-${offsetBottom}px`,
          "padding-top": `${offsetBottom}px`,
        };
      } else {
        style = {
          ...style,
          bottom: `-${offsetTop}px`,
          "padding-top": `${offsetBottom - 4}px`,
        };
      }
    } else {
      style = {
        width: `${width}px`,
        height: "100%",
        top: "0",
      };
      if (line === Split.WEST_EDGE) {
        style = {
          ...style,
          left: `-${offsetRight}px`,
          "padding-left": `${offsetRight}px`,
        };
      } else {
        style = {
          ...style,
          right: `-${offsetLeft}px`,
          "padding-left": `${offsetRight - 4}px`,
        };
      }
    }
    // convert style object to string
    return style;
  }

  function computeEdgeStyle(line) {
    return Object.entries(computeStyle(line)).reduce((acc, [key, value]) => {
      return `${acc}${key}:${value};`;
    }, "");
  }

  $: {
  }
</script>

{#if !canSplit}
  <slot />
{:else}
  <div
    bind:this={elementRoot}
    id={pane.id}
    class={clsx(
      "split-edge relative overflow-hidden",
      {
        "is-split": isDnd,
      },
      {
        "flex-shrink-0":
          typeof pane?.size === "string" &&
          pane?.size?.includes(PANE_MIN_WIDTH + ""),
      },
      {
        "overflow-visible": isCollapse(pane),
      },
      {
        "flex-1": pane?.size === "auto" && !isCollapse(pane),
      },
    )}
    style:width={paneWidth}
    style:height={paneHeight}
  >
    <slot />
    {#if isDnd}
      <div class={clsx("mask")} style:z-index={getZIndexByPaneId(pane.id)}>
        <!-- split area -->
        {#each linesFilter as line (line)}
          <Drop on:drop={() => onSplit(line)}>
            <div
              class={clsx("line", line)}
              style={computeEdgeStyle(line)}
              use:useHover
            ></div>
          </Drop>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style lang="postcss">
  .split-edge {
    @apply relative;
    .mask {
      @apply absolute top-0 left-0 w-full h-full pointer-events-none;
    }
    .line {
      @apply absolute bg-transparent z-1200 pointer-events-auto;

      &::before {
        @apply bg-primary-datadocs-blue content-[""] w-full h-full opacity-0 transition-all block duration-300 ease-out;
      }
      &.hover {
        @apply before:opacity-100;
      }
      &.west-edge,
      &.east-edge {
        @apply before:(w-1);
      }
      &.north-edge,
      &.south-edge {
        @apply before:(h-1);
      }
    }
  }
</style>
