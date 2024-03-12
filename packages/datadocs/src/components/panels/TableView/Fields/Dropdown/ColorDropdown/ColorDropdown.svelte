<script lang="ts">
  import type { FilterableColors } from "@datadocs/canvas-datagrid-ng";
  import Icon from "../../../../../common/icons/Icon.svelte";
  import type {
    KeyControlActionOptions,
    KeyControlConfig,
  } from "../../../../../common/key-control/listKeyControl";
  import { keyControlAction } from "../../../../../common/key-control/listKeyControl";
  import MenuSeparator from "../../../../../common/menu/MenuSeparator.svelte";
  import DropdownSectionTitle from "../../../../../toolbars/MainToolbar/dropdowns/common/DropdownSectionTitle.svelte";
  import { getConditionalFormattingIcon } from "../../../../../toolbars/MainToolbar/dropdowns/ConditionalFormattingDropdown/utils";
  import ColorItem from "./ColorItem.svelte";
  import type { ColorFilter } from "./types";
  import DropdownButton from "../../../../../common/form/button/DropdownButton.svelte";
  import { createEventDispatcher } from "svelte";
  import type { Placement } from "../../../../../common/form/button/type";

  const dispatch = createEventDispatcher<{ selected: ColorFilter }>();

  export let color: ColorFilter = undefined;
  export let colors: FilterableColors;

  export let smaller = false;
  export let hideLabel = false;
  /**
   * Hide text for colors.
   */
  export let symbolOnly = false;
  export let placement: Placement = "none";

  $: hasFilterableColors = checkIfHasFilterableColors(colors);
  $: isColor = color?.type === "cell" || color?.type === "text";

  $: if (!hasFilterableColors && show) {
    show = false;
  }

  let dropdown: HTMLElement;
  let show = false;

  function onChoose(newColor: ColorFilter | undefined) {
    color = newColor;
    dispatch("selected", newColor);
  }

  function checkIfHasFilterableColors(colors: FilterableColors) {
    return (
      colors &&
      (colors.cellColors.length > 0 ||
        colors.textColors.length > 0 ||
        colors.cellIcons.length > 0)
    );
  }

  const configList: KeyControlConfig[] = [];
  let keyControlOptions: KeyControlActionOptions = {
    configList: configList,
  };
</script>

<DropdownButton
  disabled={!hasFilterableColors}
  {smaller}
  {hideLabel}
  {placement}
  {...$$restProps}
  buttonType={isColor && color.code ? "container" : "dropdown"}
>
  <svelte:fragment slot="label">
    {#if color?.type === "icon"}By icon{:else}By color{/if}
  </svelte:fragment>
  <div
    slot="value"
    class="value"
    class:showing-color={isColor}
    class:symbol-only={symbolOnly}
  >
    {#if color}
      {#if color.type === "icon" && color.code}
        <Icon icon={getConditionalFormattingIcon(color.code.split(":")[1])} />
      {:else if color?.code}
        <div class="color" style:background-color={color.code}>&nbsp;</div>
      {/if}
      {#if color.type !== "icon" && (!color.code || !symbolOnly)}
        <span class="color-code">
          {#if color.code}
            {#if hideLabel}
              {#if color.type === "cell"}
                Cell Color
              {:else if color.type === "text"}
                Text Color
              {:else if color.type === "icon"}
                Icon
              {/if}
            {:else}
              {color.code}
            {/if}
          {:else if color.type === "cell"}
            No Fill
          {:else if color.type === "text"}
            Automatic
          {:else}
            No Icon
          {/if}
        </span>
      {/if}
    {:else}
      <span class="color-code">None</span>
    {/if}
  </div>
  <div slot="dropdown">
    <div
      use:keyControlAction={keyControlOptions}
      bind:this={dropdown}
      class="dropdown"
    >
      {#if colors.cellColors.length > 0}
        <DropdownSectionTitle title="Cell Color" spacing="mx-2.5 mb-0.75" />
        {#each colors.cellColors as item}
          <ColorItem
            {onChoose}
            index={0}
            scrollContainer={dropdown}
            keyControlActionOptions={keyControlOptions}
            color={{
              type: "cell",
              code: item.color,
            }}
            usageCount={item.usageCount}
          />
        {/each}
      {/if}
      {#if colors.textColors.length > 0}
        {#if colors.cellColors.length > 0}
          <MenuSeparator />
        {/if}
        <DropdownSectionTitle title="Text Color" spacing="mx-2.5 mb-0.75" />
        {#each colors.textColors as item}
          <ColorItem
            {onChoose}
            index={0}
            scrollContainer={dropdown}
            keyControlActionOptions={keyControlOptions}
            color={{
              code: item.color,
              type: "text",
            }}
            usageCount={item.usageCount}
          />
        {/each}
      {/if}
      {#if colors.cellIcons.length > 0}
        {#if colors.cellColors.length > 0 || colors.textColors.length > 0}
          <MenuSeparator />
        {/if}
        <DropdownSectionTitle title="Cell Icons" spacing="mx-2.5 mb-0.75" />
        {#each colors.cellIcons as item}
          <ColorItem
            {onChoose}
            index={0}
            scrollContainer={dropdown}
            keyControlActionOptions={keyControlOptions}
            color={{
              code: item.name,
              type: "icon",
            }}
            usageCount={item.usageCount}
          />
        {/each}
      {/if}
    </div>
  </div>
</DropdownButton>

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded py-2 h-[inherit] overflow-y-auto overflow-x-hidden min-w-[200px];
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .value {
    @apply flex flex-row items-center overflow-hidden;
    column-gap: 4px;

    &.symbol-only {
      @apply flex-1;

      &.showing-color {
        @apply items-stretch;

        .color {
          @apply w-full h-full;
        }
      }
    }

    > .color {
      @apply rounded flex-shrink-0 w-20px h-20px;
    }

    > .color-code {
      @apply whitespace-nowrap overflow-hidden overflow-ellipsis font-normal;
    }
  }
</style>
