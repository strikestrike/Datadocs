<script lang="ts">
  import Icon from "../../common/icons/Icon.svelte";
  import type { MenuItemType, MenuElementType } from "../../common/menu";
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_STATE_ENABLED,
    CLOSE_ROOT_MENU_CONTEXT_NAME,
    Menu,
  } from "../../common/menu";
  import { DropdownWrapper } from "../../common/dropdown";
  import { firestoreDocs } from "../../../app/store/store-firestore-docs";
  import { setContext } from "svelte";
  import escapeHTML from "escape-html";
  import type { FirestoreDocsOverview } from "../../../api/firestore";

  export let selectedDocId: string;
  export let selectedDocTitle = "";

  let dropdownItems: MenuItemType[] = [];
  let showDropdown: boolean = false;
  let isLoading: boolean = false;

  $: {
    const { loading, data: docs } = $firestoreDocs;
    const _matchedDoc = docs.find((it) => it.docId === selectedDocId);
    if (_matchedDoc) selectedDocTitle = _matchedDoc.docTitle;
    dropdownItems = getDropdownItems(docs);
    isLoading = loading;
  }
  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, closeDropdown);

  function getDropdownItems(docs: FirestoreDocsOverview[]): MenuItemType[] {
    return docs.map((doc): MenuElementType => {
      return {
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label:
          `<div class="flex flex-1 justify-between">` +
          `<span class="text-dark-200 text-11px">${escapeHTML(
            doc.docTitle
          )}</span>` +
          `<span class="text-gray-300 text-10px ml-1">${escapeHTML(
            doc.docId
          )}</span></div>`,
        state: MENU_DATA_ITEM_STATE_ENABLED,
        action: () => {
          selectedDocId = doc.docId;
          closeDropdown();
        },
      };
    });
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
    {#if selectedDocTitle}
      <span>{selectedDocTitle}</span>
    {:else if isLoading}
      <span class="text-gray-300">Loading ...</span>
    {:else}
      <span class="text-gray-300">Please select a document</span>
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
