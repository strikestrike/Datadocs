<script lang="ts">
  import { getContext } from "svelte";
  import {
    CLOSE_DROPDOWN_CONTEXT_NAME,
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME,
  } from "../../../common/dropdown";
  import { keyControlAction } from "../../../common/key-control/listKeyControl";
  import type {
    KeyControlActionOptions,
    KeyControlConfig,
  } from "../../../common/key-control/listKeyControl";
  import NameElement from "./NameElement.svelte";
  import {
    MenuElement,
    MENU_DATA_ITEM_TYPE_ELEMENT,
  } from "../../../common/menu";
  import type { ComponentDescriptor } from "@datadocs/canvas-datagrid-ng";
  import { nameBoxState } from "../../../../app/store/writables";
  import { getRootNamespace } from "../../../../app/store/store-namespace";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  const updateDropdown: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );

  export let defaultKeyControlList: KeyControlConfig[] = [];
  export let onItemSelected: (item: ComponentDescriptor) => void;

  let names: ComponentDescriptor[] = [];

  $: if ($nameBoxState) {
    names = getNames();
    setTimeout(updateDropdown);
  }

  function getNames() {
    const namespace = getRootNamespace();
    const items: ComponentDescriptor[] = [];

    namespace.forEachComponent(true, (name, type, item, controller) => {
      items.push({ name, type, item, controller });
      return true;
    });
    items.sort((a, b) => a.name.localeCompare(b.name));

    return items;
  }

  function handleSelectItem(item: ComponentDescriptor) {
    onItemSelected(item);
    closeDropdown();
  }

  let element: HTMLElement = null;
  const keyControlList: KeyControlConfig[] = [...defaultKeyControlList];
  const keyControlOptions: KeyControlActionOptions = {
    configList: keyControlList,
  };
</script>

<div
  bind:this={element}
  class="dropdown"
  use:keyControlAction={keyControlOptions}
>
  <div class="flex flex-col text-13px font-medium">
    {#each names as value, i}
      <NameElement
        index={i + 100}
        {keyControlList}
        {handleSelectItem}
        {value}
        scrollContainer={element}
      />
    {:else}
      <MenuElement
        data={{
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: "No names yet...",
          state: "disabled",
          action: () => {},
        }}
        isContextMenu={true}
        scrollContainer={element}
        index={10}
        keyControlActionOptions={keyControlOptions}
      />
    {/each}
  </div>
</div>

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded py-1.5 h-[inherit] overflow-y-auto overflow-x-hidden;
    min-width: 100px;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }
</style>
