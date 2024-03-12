<script lang="ts">
  import { getContext } from "svelte";
  import type {
    NormalCellDescriptor,
    ParserCellData,
    ColumnType,
    CellStructFormat,
  } from "@datadocs/canvas-datagrid-ng";
  import { getDisplayValue, getStructFieldItems } from "../util";
  import StructFieldValue from "./StructFieldValue.svelte";
  import LoadImage from "../../../common/load-image/LoadImage.svelte";
  import { UPDATE_DROPDOWN_STYLE_CONTEXT_NAME } from "../../../common/dropdown";
  import LoadingAnimation from "../../../common/load-image/LoadingAnimation.svelte";
  import {
    findFreeFormStructActiveField,
    findTableStructActiveField,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-format";
  import { columnTypeToString } from "@datadocs/canvas-datagrid-ng/lib/utils/column-types";

  export let data: NormalCellDescriptor;
  export let chipIndex: number = 0;
  /**
   * Indicate if this menu is used in struct array menu
   */
  export let isChildMenu = false;

  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );

  let fieldItems: Array<{
    key: string;
    value: ParserCellData | { columnType: ColumnType; value: any };
  }> = [];
  let isChipFormat = false;
  let chipFieldValue = "";
  let imageLoaded = false;
  let successLoadImage = false;
  let imageUrl: string = "";
  let hasScrollIndication = false;
  let menuElement: HTMLElement;
  let showMenu = true;

  function checkChipFormat() {
    const df = data.dataFormat;
    return df && df.type === "struct" && df.format === "chip";
  }

  function updateCellStructMenu() {
    const structItems = getStructFieldItems(data, chipIndex);

    isChipFormat = checkChipFormat();
    if (!structItems || !isChipFormat) {
      return;
    }

    fieldItems = [...structItems.fieldItems];
    const displayField = (data.dataFormat as CellStructFormat)?.display;
    const imageField = (data.dataFormat as CellStructFormat)?.image;
    const excludingItems: string[] = [];

    if (structItems.parserData) {
      const activeField = findFreeFormStructActiveField(
        { value: structItems.parserData, dataType: "struct" },
        displayField,
        false
      );
      if (activeField) {
        chipFieldValue = getDisplayValue(activeField, true) as string;
        if (displayField.length === 1) {
          // put the top items that is used for display value into excluding list
          excludingItems.push(displayField[0]);
        }
      } else {
        const firstItem = fieldItems[0].value as ParserCellData;
        if (firstItem.dataType !== "struct") {
          // put the first items into excluding list if not struct type
          chipFieldValue = getDisplayValue(firstItem, true) as string;
          excludingItems.push(fieldItems[0].key);
        } else {
          const firstField = findFreeFormStructActiveField(firstItem, null);
          chipFieldValue = getDisplayValue(firstField, true) as string;
        }
      }
    } else if (structItems.tableStructData) {
      const { value, type } = structItems.tableStructData;
      const activeField = findTableStructActiveField(
        value,
        type,
        displayField,
        false
      );
      if (activeField) {
        const { childValue: value, childType: columnType } = activeField;
        chipFieldValue = getDisplayValue({ value, columnType }, true) as string;
        if (displayField.length === 1) {
          // put the top items that is used for display value into excluding list
          excludingItems.push(displayField[0]);
        }
      } else {
        const firstField = findTableStructActiveField(
          value,
          type,
          displayField
        );
        chipFieldValue = getDisplayValue(
          { value: firstField.childValue, columnType: firstField.childType },
          true
        ) as string;
        if (columnTypeToString(type.children[0]?.type) !== "struct") {
          // put the first items into excluding list if not struct type
          excludingItems.push(fieldItems[0].key);
        }
      }
    }

    // get Image url
    if (imageField && imageField.length > 0) {
      if (structItems.parserData) {
        const imageItem = findFreeFormStructActiveField(
          { value: structItems.parserData, dataType: "struct" },
          imageField,
          false
        );
        if (imageItem && imageItem.dataType === "string") {
          imageUrl = getDisplayValue(imageItem, true) as string;
        }
      } else {
        const { value, type } = structItems.tableStructData;
        const imageItem = findTableStructActiveField(
          value,
          type,
          imageField,
          false
        );
        if (imageItem && columnTypeToString(imageItem.childType) === "string") {
          imageUrl = getDisplayValue(
            { value: imageItem.childValue, columnType: imageItem.childType },
            true
          ) as string;
        }
      }
    }
    // console.log("debug here ==== ", { chipFieldValue, fieldItems });
    fieldItems = fieldItems.filter(
      (item) => !excludingItems.includes(item.key)
    );
  }

  function onMenuStyleChange() {
    setTimeout(updateDropdownStyle);
  }

  function onMenuScroll() {
    hasScrollIndication = menuElement.scrollTop > 4;
  }

  // function getMaxDropdownHeight(isChipFormat: boolean) {
  //   const windowHeight = window.innerHeight - 20;
  //   const maxMenuHeight = 300;
  //   const chipMenuHeightDelta = 50;

  //   if (isChipFormat) {
  //     return Math.min(windowHeight, maxMenuHeight - chipMenuHeightDelta);
  //   } else {
  //     return Math.min(windowHeight, maxMenuHeight);
  //   }
  // }

  // setTimeout(() => {
  //   showMenu = true;
  //   onMenuStyleChange();
  // }, 100);

  $: data, chipIndex, updateCellStructMenu();
  $: successLoadImage, onMenuStyleChange();
</script>

<div
  class="struct-layover flex flex-col py-2 max-h-full"
  class:pt-1.5={isChildMenu}
  class:hidden={!showMenu}
  on:mousemove|stopPropagation
>
  {#if isChipFormat}
    <div class="relative px-2" class:bottom-shadow={hasScrollIndication}>
      <LoadImage
        {imageUrl}
        bind:isLoaded={imageLoaded}
        bind:isSuccess={successLoadImage}
      />

      {#if !imageLoaded}
        <div
          class="absolute left-0 right-0 top-0 flex flex-row items-center justify-center"
        >
          <LoadingAnimation delay={100} />
        </div>
      {/if}

      {#if successLoadImage}
        <div class="w-full flex flex-row mb-2 items-center justify-center">
          <div class="w-[360px] h-[180px] rounded-sm bg-light-50">
            {#if successLoadImage}
              <img
                style="height: 100%; width: 100%; object-fit: contain;"
                src={imageUrl}
                alt="ChipImage"
              />
            {/if}
          </div>
        </div>
      {/if}

      <div
        class="max-w-[360px] pl-2 pb-2 leading-[22px] text-15px text-black font-medium whitespace-nowrap overflow-hidden overflow-ellipsis"
      >
        {chipFieldValue}
      </div>
    </div>
  {/if}

  <div
    bind:this={menuElement}
    on:wheel={onMenuScroll}
    on:scroll={onMenuScroll}
    class="flex-grow overflow-y-auto"
    style="max-height: 250px"
  >
    <div class="struct-menu-grid">
      {#each fieldItems as item}
        <div class="field-key">{item.key}</div>

        <div class="field-value-container">
          <StructFieldValue data={item.value} isRoot={true} />
        </div>
      {/each}
    </div>
  </div>
</div>

<style lang="postcss">
  .struct-menu-grid {
    @apply pl-4 pr-2.5;
    display: grid;
    grid-template-columns: 70px 280px;
    column-gap: 2px;
    row-gap: 4px;
  }

  .struct-layover :global(*) {
    @apply select-text;
  }

  .field-key {
    @apply py-[3px] whitespace-nowrap overflow-x-hidden overflow-ellipsis;
    @apply uppercase text-11px font-medium;
  }

  .field-value-container {
    @apply text-[#294EB7] text-12px;
  }

  .bottom-shadow::before {
    @apply absolute pointer-events-none;
    content: "";
    left: 0px;
    right: 0px;
    top: -200px;
    bottom: 0px;
    box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.2);
  }
</style>
