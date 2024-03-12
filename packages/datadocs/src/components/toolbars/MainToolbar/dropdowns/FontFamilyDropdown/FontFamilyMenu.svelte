<script lang="ts">
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_TYPE_LIST,
    MenuElement,
    MenuList,
  } from "../../../../common/menu";
  import type { MenuItemType } from "../../../../common/menu";
  import type { KeyControlActionOptions } from "../../../../common/key-control/listKeyControl";

  export let data: MenuItemType[];
  export let scrollContainer: HTMLElement = null;
  export let keyControlOptions: KeyControlActionOptions;
  export let startIndex: number;
</script>

<div class="flex flex-col min-w-[250px] bg-white">
  {#each data as item, index}
    {#if item.type === MENU_DATA_ITEM_TYPE_ELEMENT}
      <MenuElement
        data={item}
        isContextMenu={false}
        index={startIndex + index}
        keyControlActionOptions={keyControlOptions}
        {scrollContainer}
      />
    {:else if item.type === MENU_DATA_ITEM_TYPE_LIST}
      <MenuList
        data={item}
        isContextMenu={false}
        index={startIndex + index}
        keyControlActionOptions={keyControlOptions}
        {scrollContainer}
      />
    {/if}
  {/each}
</div>
