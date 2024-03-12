<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type { SearchNodeData } from "../../../../common/file-system/fileSystemStateManager";
  import type { DatadocsFileSystemManager } from "../file-system/datadocsFileSystemManager";
  import type { Node } from "../../../../common/file-system/fileSystemStateManager";
  import type { DatadocsObjectNode } from "../type";
  import { FILE_SYSTEM_STATE_MANAGER_CONTEXT } from "../../../../common/file-system/flat-file-system/constant";
  import SearchNode from "./SearchNode.svelte";
  import SearchResultEmpty from "../../../../common/file-system/search/SearchResultEmpty.svelte";
  import SearchLoading from "../../../../common/file-system/search/SearchLoading.svelte";
  import LoadMore from "./LoadMore.svelte";

  export let hasNextPage: boolean;

  const stateManager: DatadocsFileSystemManager = getContext(
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  );
  let searchNodes: SearchNodeData<Node<DatadocsObjectNode>>[] = [];
  let searchText = "";
  let searching = false;

  // init search view state
  updateSearchData();

  function updateSearchData() {
    searchNodes = stateManager.getSearchNodes();
    searchText = getSearchText();
    searching = checkSearching();
  }

  function getSearchText() {
    return stateManager.getSearchConfig().searchText;
  }

  function checkSearching() {
    return stateManager.isSearchInProgress();
  }

  onMount(() => {
    stateManager.addListener("datachange", updateSearchData);

    return () => {
      stateManager.removeListener("datachange", updateSearchData);
    };
  });

  $: searchResultEmpty = !searchNodes || searchNodes.length === 0;
</script>

{#if searching}
  <div class="mt-5">
    <SearchLoading />
  </div>
{:else if searchResultEmpty}
  <div class="mt-5">
    <SearchResultEmpty {searchText} />
  </div>
{:else}
  {#each searchNodes as searchNode}
    <SearchNode path={searchNode.path} node={searchNode.node} />
  {/each}

  {#if hasNextPage}
    <LoadMore />
  {/if}
{/if}
