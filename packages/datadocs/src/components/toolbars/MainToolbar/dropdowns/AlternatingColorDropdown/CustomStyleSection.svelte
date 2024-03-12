<script lang="ts">
  import { onMount, tick } from "svelte";
  import { get } from "svelte/store";
  import CustomStyleSwitch from "./CustomStyleSwitch.svelte";
  import PickColorButton from "../common/PickColorButton.svelte";
  import {
    activeAlternatingColors,
    getAlternatingColorByName,
    getFirstAlternatingColor,
  } from "./default";
  import { editCustomAlternatingColors } from "./default";
  import { isStandardColorKey } from "../../../../../app/store/store-toolbar";
  import { parseToHex } from "../utils/colorUtils";
  import type { GridKeyControlActionOptions } from "../../../../common/key-control/gridKeyControl";

  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let scrollContainer: HTMLElement;
  export let startRowIndex: number;

  const data =
    getAlternatingColorByName(get(activeAlternatingColors).value) ||
    getFirstAlternatingColor();
  let hasHeader = !!data.header;
  let hasFooter = !!data.footer;
  let headerColor = isStandardColorKey(data.header)
    ? data.header || "#ffffff"
    : parseToHex(data.header);
  let oddRowColor = isStandardColorKey(data.oddRow)
    ? data.oddRow
    : parseToHex(data.oddRow);
  let evenRowColor = isStandardColorKey(data.evenRow)
    ? data.evenRow
    : parseToHex(data.evenRow);
  let footerColor = isStandardColorKey(data.footer)
    ? data.footer || "#ffffff"
    : parseToHex(data.footer);
  let isMounted = false;

  function editAlternativeColors() {
    if (!isMounted) return;
    editCustomAlternatingColors(data.name, {
      header: (hasHeader && headerColor) || "",
      footer: (hasFooter && footerColor) || "",
      evenRow: evenRowColor,
      oddRow: oddRowColor,
    });
  }

  onMount(() => {
    isMounted = true;
  });

  $: hasHeader,
  hasFooter,
  headerColor,
  footerColor,
  oddRowColor,
  evenRowColor,
  editAlternativeColors();
</script>

{#key startRowIndex}
<div class="grid grid-cols-2">
  <CustomStyleSwitch
    bind:on={hasHeader}
    label="Header"
    ridx={startRowIndex}
    cidx={0}
    {gridKeyControlOptions}
    {scrollContainer}
  />
  <CustomStyleSwitch
    bind:on={hasFooter}
    label="Footer"
    ridx={startRowIndex}
    cidx={1}
    {gridKeyControlOptions}
    {scrollContainer}
  />
</div>

<div class="grid grid-cols-2 gap-2 pt-3">
  <div class="pick-color-btn">
    <PickColorButton
      bind:color={oddRowColor}
      label="Color 1"
      ridx={startRowIndex + 1}
      cidx={0}
      {gridKeyControlOptions}
      {scrollContainer}
    />
  </div>
  <div class="pick-color-btn">
    <PickColorButton
      bind:color={evenRowColor}
      label="Color 2"
      ridx={startRowIndex + 1}
      cidx={1}
      {gridKeyControlOptions}
      {scrollContainer}
    />
  </div>
  <div class="pick-color-btn">
    {#if hasHeader}
      <PickColorButton
        bind:color={headerColor}
        label="Header"
        ridx={startRowIndex + 2}
        cidx={0}
        {gridKeyControlOptions}
        {scrollContainer}
      />
    {/if}
  </div>
  <div class="pick-color-btn">
    {#if hasFooter}
      <PickColorButton
        bind:color={footerColor}
        label="Footer"
        ridx={startRowIndex + 2}
        cidx={1}
        {gridKeyControlOptions}
        {scrollContainer}
      />
    {/if}
  </div>
</div>
{/key}

<style lang="postcss">
  .pick-color-btn {
    @apply h-8 w-full;
  }
</style>
