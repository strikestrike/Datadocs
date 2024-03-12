<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type { RemoteFileSystemItem } from "../../../../../app/store/panels/sources/type";
  import type { Node } from "../../../../common/file-system/fileSystemStateManager";
  import type { RemoteFileSystemStateManager } from "../../manager/remoteFileSystemManager";
  import { REMOTE_FILES_SYSTEM_MANAGER_CONTEXT } from "../../constant";
  import RemoteFileNode from "./node/RemoteFileNode.svelte";

  const stateManager: RemoteFileSystemStateManager<RemoteFileSystemItem> =
    getContext(REMOTE_FILES_SYSTEM_MANAGER_CONTEXT);

  let childNodes: Node<RemoteFileSystemItem>[];
  let rootNode: Node<RemoteFileSystemItem>;

  function onRemoteFileSystemStateChange() {
    rootNode = stateManager.getUIRoot();
    childNodes = rootNode
      ? stateManager.getChildNodesById(rootNode.id)
      : stateManager.getRootChildNodes();
    childNodes = childNodes ?? [];
  }

  onMount(() => {
    onRemoteFileSystemStateChange();
    stateManager.addListener("datachange", onRemoteFileSystemStateChange);
    return () => {
      stateManager.removeListener("datachange", onRemoteFileSystemStateChange);
    };
  });
</script>

{#if childNodes && childNodes.length > 0}
  {#each childNodes as value}
    <RemoteFileNode node={value} />
  {/each}
{/if}
