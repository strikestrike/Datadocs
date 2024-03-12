<script lang="ts">
  import { tick } from "svelte";
  import type {
    CellStyle,
    CellBorders,
    BorderStyle,
    BorderPosition,
  } from "./default";
  import { getActiveCellStyle } from "../../../../../app/store/store-toolbar";
  import type {
    GridKeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../common/key-control/gridKeyControl";
  import { registerElement } from "../../../../common/key-control/gridKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";

  export let cellStyle: CellStyle;
  export let hasRoundedBorder: boolean;
  export let handleSelectCellStyle: (value: string) => void;
  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let scrollContainer: HTMLElement = null;
  export let ridx: number;
  export let cidx: number;

  const isActive = getActiveCellStyle() === cellStyle.name;
  let isSelected = false;
  let element: HTMLButtonElement;

  function getCssStyle(cellStyle: CellStyle): string {
    const getBordersStyle = (borders: CellBorders): string => {
      if (!borders) return "";
      const borderStyleToString = (
        position: BorderPosition,
        value: BorderStyle
      ): string => {
        return `border-${position}: ${value.borderWidth} ${value.borderStyle} ${value.borderColor};`;
      };
      let borderStyle = "";
      borderStyle += borders.top ? borderStyleToString("top", borders.top) : "";
      borderStyle += borders.bottom
        ? borderStyleToString("bottom", borders.bottom)
        : "";
      borderStyle += borders.left
        ? borderStyleToString("left", borders.left)
        : "";
      borderStyle += borders.right
        ? borderStyleToString("right", borders.right)
        : "";
      return borderStyle;
    };

    let style = "";
    style += cellStyle.textColor ? `color: ${cellStyle.textColor};` : "";
    style += cellStyle.backgroundColor
      ? `background-color: ${cellStyle.backgroundColor};`
      : "";
    style += cellStyle.fontSize ? `font-size: ${cellStyle.fontSize};` : "";
    style += cellStyle.textDecoration
      ? `text-decoration: ${cellStyle.textDecoration};`
      : "";
    style += getBordersStyle(cellStyle.borders);
    return style;
  }

  async function onSelectCallback(byKey = true) {
    isSelected = true;
    element.focus();
    if (!byKey) return;
    await tick();
    scrollVerticalToVisible(scrollContainer, element);
  }

  function onDeselectCallback() {
    if (document.activeElement === element) element.blur();
    isSelected = false;
  }

  const options: RegisterElementOptions = {
    gridKeyControlOptions,
    ridx,
    cidx,
    config: {
      ridx,
      cidx,
      isSelected,
      onDeselectCallback,
      onSelectCallback,
    },
  };
</script>

<div
  class:active={isActive}
  class:selected={isSelected}
  class:rounded-border={hasRoundedBorder}
>
  <button
    bind:this={element}
    style={getCssStyle(cellStyle)}
    on:click={() => handleSelectCellStyle(cellStyle.name)}
    use:registerElement={options}
    tabindex={-1}
  >
    <span>{cellStyle.label}</span>
  </button>
</div>

<style lang="postcss">
  div {
    @apply relative;
  }

  div::before {
    @apply absolute -top-1 -bottom-1 -left-1 -right-1 border-[2.5px] rounded-lg border-solid border-primary-datadocs-blue bg-transparent pointer-events-none;
    z-index: 10;
  }

  div.active::before,
  div.selected::before {
    content: "";
  }

  button {
    @apply relative w-full h-9 rounded-none font-medium border-none outline-none;
    box-sizing: border-box;
    font-size: 13px;
  }

  .rounded-border button {
    @apply rounded;
  }
</style>
