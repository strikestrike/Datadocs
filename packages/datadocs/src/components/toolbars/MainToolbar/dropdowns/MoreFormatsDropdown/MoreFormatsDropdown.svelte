<script lang="ts">
  import type { SvelteComponent } from "svelte";
  import { getContext, setContext } from "svelte";
  import { getFormatDataTypeList } from "../../../../../app/store/store-toolbar";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import StructFormatMenu from "./children/struct/StructFormatMenu.svelte";
  import MenuSeparator from "./components/MenuSeparator.svelte";
  import ChangeDataType from "./components/extra-option/ChangeDataType.svelte";
  import CustomFormat from "./components/extra-option/CustomFormat.svelte";
  import MultipleTypesMenu from "./children/multiple-types/MultipleTypesMenu.svelte";
  import {
    getBaseType,
    transformNumberType,
  } from "@datadocs/canvas-datagrid-ng/lib/utils/column-types";
  import { FIRST_SELECTED_STRING_DATA, isValidMenuType } from "./util";
  import SingleTypeMenu from "./children/single-type/SingleTypeMenu.svelte";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  const data = getFormatDataTypeList();
  const typeList = data.types;
  let isMultipleTypes: boolean;
  let multipleTypes: string[];
  let singleMenuDataType: string;
  const menuComponent = getMoreFormatsMenuComponent(typeList);

  function getMoreFormatsMenuComponent(
    types: string[]
  ): typeof SvelteComponent {
    const normalizedTypes = types.map((type) => {
      const baseType = getBaseType(type);
      return transformNumberType(baseType);
    });
    const isSingleTypeSelected =
      normalizedTypes.length > 0 &&
      normalizedTypes.every((type) => type === normalizedTypes[0]);

    if (isSingleTypeSelected) {
      isMultipleTypes = false;
      if (isValidMenuType(normalizedTypes[0])) {
        singleMenuDataType = normalizedTypes[0];
        return singleMenuDataType === "struct"
          ? StructFormatMenu
          : SingleTypeMenu;
      } else {
        closeDropdown();
        return null;
      }
    } else {
      const types = normalizedTypes
        .filter((type) => isValidMenuType(type))
        .sort();
      if (types.length > 0) {
        multipleTypes = Array.from(new Set(types));
        isMultipleTypes = true;
        return MultipleTypesMenu;
      } else {
        closeDropdown();
        return null;
      }
    }
  }

  setContext(FIRST_SELECTED_STRING_DATA, data.firstString);
</script>

{#if menuComponent}
  <div class="dropdown">
    {#if isMultipleTypes}
      <svelte:component
        this={menuComponent}
        types={multipleTypes}
        structData={data.firstStruct}
        firstCells={data.firstCells}
      />
    {:else}
      <svelte:component this={menuComponent} dataType={singleMenuDataType} />
    {/if}
    <MenuSeparator />
    <ChangeDataType />
    <CustomFormat />
  </div>
{/if}

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded pb-1.5 h-[inherit] overflow-y-auto overflow-x-hidden;
    min-width: 300px;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }
</style>
