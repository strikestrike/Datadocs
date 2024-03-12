<script lang="ts" context="module">
  export type SelectorBaseItemType = {
    id: number | string;
    title: string;
  };
</script>

<script
  lang="ts"
  generics="ItemType extends SelectorBaseItemType, DropdownProps"
>
  import DefaultSelectorItem from "./DefaultSelectorItem.svelte";

  import Icon from "../icons/Icon.svelte";
  import type {
    MenuItemType,
    MenuComponentType,
    MenuElementType,
  } from "../menu";
  import {
    CLOSE_ROOT_MENU_CONTEXT_NAME,
    Menu,
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_COMPONENT,
    MENU_DATA_ITEM_TYPE_ELEMENT,
  } from "../menu";
  import { DropdownWrapper } from "../dropdown";
  import { createEventDispatcher, setContext } from "svelte";
  import type { ComponentType, SvelteComponentTyped } from "svelte";

  export let selectedId: string | number | undefined = undefined;
  export let loading: boolean = false;
  export let placeholder = "Please select an item";
  export let items: ItemType[] = [];
  export let unknownSelectedTitle = `Unknown item ${selectedId}`;

  export let DropDownItemComponent: ComponentType<
    SvelteComponentTyped<DropdownProps, any, any>
  > = DefaultSelectorItem as any;
  export let dropdownItemProps:
    | ((item: ItemType) => DropdownProps)
    | undefined = undefined;

  const dispatcher = createEventDispatcher<{
    select: { id: number | string; item: ItemType };
  }>();

  $: showDropdown = false;
  $: selectedTitle =
    typeof selectedId === "string" || typeof selectedId === "number"
      ? getItemTitle(items, selectedId)
      : "";
  $: dropdownItems = showDropdown ? getDropdownItems(items) : [];

  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, closeDropdown);
  function getDropdownItems(docs: ItemType[]): MenuItemType[] {
    return docs.map((doc): MenuElementType => {
      const props = dropdownItemProps ? dropdownItemProps(doc) : { ...doc };
      return {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: DropDownItemComponent,
        labelProps: props,
        state: MENU_DATA_ITEM_STATE_ENABLED,
        action: () => dispatcher("select", { id: doc.id, item: doc }),
      };
    });
  }

  function getItemTitle(
    items: ItemType[],
    id: string | number
  ): string | undefined {
    const item = items.find((it) => it.id === id);
    if (item) return item.title;
    return unknownSelectedTitle;
  }

  function closeDropdown() {
    showDropdown = false;
  }
</script>

<DropdownWrapper
  autoWidth
  bind:show={showDropdown}
  distanceToDropdown={4}
  closeOnEscapeKey={true}
  closeOnMouseDownOutside={true}
>
  <button
    slot="button"
    type="button"
    class="focusable relative w-full px-4 text-11px font-medium h-10 flex flex-row items-center border border-solid rounded border-light-100"
    on:click={() => {
      showDropdown = !showDropdown;
    }}
  >
    {#if selectedTitle}
      <span>{selectedTitle}</span>
    {:else if loading}
      <span class="text-gray-300">Loading ...</span>
    {:else}
      <span class="text-gray-300">{placeholder}</span>
    {/if}

    <div
      class="absolute top-0 bottom-0 right-[18px] flex flex-row items-center"
    >
      <Icon icon="toolbar-arrow-dropdown" width="7px" height="4px" />
    </div>
  </button>

  <div class="p-0 m-0 h-[inherit]" slot="content">
    <Menu
      data={dropdownItems}
      menuClass="min-w-[220px]"
      isRoot
      isContextMenu={false}
    />
  </div>
</DropdownWrapper>

<style lang="postcss">
  button,
  button:active,
  button:hover,
  button:focus {
    border: 1px solid #e9edf0 !important;
  }
</style>
