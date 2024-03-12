<script lang="ts">
  import { getContext } from "svelte";
  import { FILE_SYSTEM_ACTION_CONTEXT } from "../../../../common/file-system/flat-file-system/constant";
  import type { DatadocsFileSystemAction } from "./action";
  import type { FileSystemCustomNode } from "../../../../common/file-system/flat-file-system/flatFileSystemManager";
  import IconLoadMore from "./IconLoadMore.svg?raw";
  import { createSingleRunAsync } from "../../../../../utils/helpers";

  export let node: FileSystemCustomNode;

  const fileSystemActions: DatadocsFileSystemAction = getContext(
    FILE_SYSTEM_ACTION_CONTEXT,
  );

  const handleLoadMore = createSingleRunAsync(async () => {
    await fileSystemActions.loadListDirNextPage();
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  on:click={handleLoadMore}
  class="flex flex-row items-center text-primary-indigo-blue cursor-pointer pl-2.5 py-0.5 whitespace-nowrap overflow-hidden"
>
  <div class="text-13px">View more items</div>
  <div class="pl-0.5">{@html IconLoadMore}</div>
</div>
