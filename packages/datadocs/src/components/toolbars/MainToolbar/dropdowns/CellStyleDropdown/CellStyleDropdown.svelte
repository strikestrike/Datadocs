<script lang="ts">
  import { getContext } from "svelte";
  import Title from "../common/DropdownSectionTitle.svelte";
  import CellStyleElement from "./CellStyleElement.svelte";
  import { cellStyleData } from "./default";
  import { setActiveCellStyle } from "../../../../../app/store/store-toolbar";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import { gridKeyControlAction } from "../../../../common/key-control/gridKeyControl";
  import type {
    GridKeyControlConfig,
    GridKeyControlActionOptions,
  } from "../../../../common/key-control/gridKeyControl";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  const numberOfSection = cellStyleData.length;
  const elementsPerRow = 4;
  let dropdownElement: HTMLElement;
  const sectionsStartRowIndex: number[] = [];

  function handleSelectCellStyle(value: string) {
    setActiveCellStyle(value);
    closeDropdown();
  }

  function calculateSectionsStartRowIndex() {
    for (let i = 0; i < numberOfSection; i++) {
      if (i === 0) {
        sectionsStartRowIndex[i] = 0;
        continue;
      }

      const previousSectionLength = cellStyleData[i - 1].data.length;
      sectionsStartRowIndex[i] =
        sectionsStartRowIndex[i - 1] +
        Math.ceil(previousSectionLength / elementsPerRow) +
        1;
    }
  }

  calculateSectionsStartRowIndex();
  const configList: GridKeyControlConfig[][] = [];
  const options: GridKeyControlActionOptions = {
    configList: configList,
  };

  $: if (dropdownElement) {
    setTimeout(() => dropdownElement.focus());
  }
</script>

<div
  class="dropdown"
  style="--elements-per-row: {elementsPerRow};"
  bind:this={dropdownElement}
  use:gridKeyControlAction={options}
  tabindex={-1}
>
  {#each cellStyleData as cellStyleSection, sectionIndex}
    <div class="px-4">
      <Title title={cellStyleSection.name} />
      <div class="cell-style-list">
        {#each cellStyleSection.data as cellStyle, cellIdx}
          {@const cidx = cellIdx % elementsPerRow}
          {@const ridx =
            sectionsStartRowIndex[sectionIndex] + Math.floor(cellIdx / 4)}
          <CellStyleElement
            {cellStyle}
            {handleSelectCellStyle}
            hasRoundedBorder={cellStyleSection.hasBorderRadius}
            {ridx}
            {cidx}
            scrollContainer={dropdownElement}
            gridKeyControlOptions={options}
          />
        {/each}
      </div>
    </div>

    {#if sectionIndex < numberOfSection - 1}
      <div class="w-full h-px my-3 border-b border-solid border-light-100" />
    {/if}
  {/each}
</div>

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded py-3 h-[inherit] outline-none overflow-x-hidden overflow-y-auto;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .cell-style-list {
    @apply grid gap-3;
    grid-template-columns: repeat(var(--elements-per-row), 90px);
  }
</style>
