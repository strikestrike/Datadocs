<script lang="ts">
  import Icon from "../../../common/icons/Icon.svelte";
  import type { DatadocsFileSystemAction } from "./file-system/action";
  import type { BreadcrumbItem } from "../../../common/panel/breadcrumb/type";
  import type { DatadocsFileSystemManager } from "./file-system/datadocsFileSystemManager";
  import Breadcrumb from "../../../common/panel/breadcrumb/Breadcrumb.svelte";
  import { getContext, onMount } from "svelte";
  import {
    FILE_SYSTEM_ACTION_CONTEXT,
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  } from "../../../common/file-system/flat-file-system/constant";
  import Sort from "./sort/Sort.svelte";
  import CreateObject from "./create-object/CreateObject.svelte";
  import Reload from "./reload/Reload.svelte";

  const fileSystemActions: DatadocsFileSystemAction = getContext(
    FILE_SYSTEM_ACTION_CONTEXT
  );
  const manager: DatadocsFileSystemManager = getContext(
    FILE_SYSTEM_STATE_MANAGER_CONTEXT
  );

  const home: BreadcrumbItem = {
    id: "__datadocs_panel_root_id",
    name: "HOME",
    action: async () => {
      fileSystemActions.deselectAll();
      fileSystemActions.openNode(null);
    },
  };
  let paths: BreadcrumbItem[] = [];

  function buildBreadcrumbPaths(): BreadcrumbItem[] {
    const paths: BreadcrumbItem[] = [];

    let currentId = manager.getUIRootId();
    while (currentId) {
      const node = manager.getNodeById(currentId);
      const nodeId = currentId;

      paths.unshift({
        id: nodeId,
        name: node.name,
        action: async () => {
          fileSystemActions.deselectAll();
          fileSystemActions.openNode(nodeId);
        },
      });

      currentId = node.parent;
    }

    return paths;
  }

  function updateBreadcrumb() {
    paths = manager.hasSearch() ? [] : buildBreadcrumbPaths();
  }

  onMount(() => {
    updateBreadcrumb();
    manager.addListener("datachange", updateBreadcrumb);
    return () => {
      manager.removeListener("datachange", updateBreadcrumb);
    };
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="panel-dd-toolbar flex flex-row items-center max-w-full py-0.5 pl-2.5 pr-1"
>
  <div class="flex-grow flex-shrink min-w-0">
    <Breadcrumb {home} {paths} separator="panel-breadcrumb-separator" />
  </div>

  <div class="flex flex-row items-center flex-shrink-0 pl-2 gap-0.5">
    <Reload />
    <Sort />
    <CreateObject />
  </div>
</div>

<style>
  .panel-dd-toolbar {
    background: #fff;
    box-shadow: 0px 3px 6px -3px rgba(55, 84, 170, 0.16);
  }
</style>
