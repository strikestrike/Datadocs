<script lang="ts">
  import { getContext } from "svelte";
  import type { DatadocsFileSystemAction } from "./file-system/action";
  import SearchBox from "../../../common/panel/SearchBox.svelte";
  import { FILE_SYSTEM_ACTION_CONTEXT } from "../../../common/file-system/flat-file-system/constant";
  import { createSimpleDebounce } from "../../../../utils/helpers";

  const fileSystemActions: DatadocsFileSystemAction = getContext(
    FILE_SYSTEM_ACTION_CONTEXT,
  );
  const SEARCH_DELAY = 1000;
  let searchText: string = "";

  async function search(value: string) {
    await fileSystemActions.search(value);
  }

  const debouce = createSimpleDebounce(async (value: string) => {
    await search(value);
  }, SEARCH_DELAY);

  async function handleSearch(value: string, immediate = false) {
    if (!value || immediate) {
      debouce.immediate(value);
    } else {
      debouce.debounce(value);
    }
  }

  async function searchByEnterKey(value: string) {
    await handleSearch(value, true);
  }

  $: searchText, handleSearch(searchText);
</script>

<div class="p-3">
  <SearchBox
    bind:searchText
    showClearButton={false}
    onSearch={searchByEnterKey}
  />
</div>
