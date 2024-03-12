<script lang="ts">
  import type { DatadocsObjectNodeDetails } from "../../../../../api";
  import type { NodeDetailItemData } from "./type";
  import type { DatadocsObjectNode } from "../type";
  import InfoTable from "./InfoTable.svelte";
  import OpenWorkbook from "./OpenWorkbook.svelte";
  import type { Node } from "../../../../common/file-system/fileSystemStateManager";
  import {
    getCustomDateTimeString,
    getTimeDifference,
  } from "../../../../../utils/dateTime";
  import {
    loadDatadocsObjectDetails,
    getDatadocsObjectDetails,
  } from "../../../../../api/datadocs-panel";
  import DetailHeader from "./DetailHeader.svelte";
  import { datadocsObjectDetailsMapStore } from "../../../../../app/store/writables";
  import { onMount } from "svelte";
  import type { DatadocsFileSystemManager } from "../file-system/datadocsFileSystemManager";

  export let data: Node<DatadocsObjectNode>;
  export let selectionCount = 0;
  export let stateManager: DatadocsFileSystemManager;

  let items: NodeDetailItemData[] = null;
  let nodeType: DatadocsObjectNode["type"];
  let nodeName: string;
  let objectDetail: DatadocsObjectNodeDetails;

  const loadNodeDetailsData = async () => {
    if (selectionCount > 1) {
      return;
    }

    loadDatadocsObjectDetails(data.dataNode.id);
    updateObjectDetailsUI();
  };

  function updateObjectDetailsUI() {
    const details = getDatadocsObjectDetails(data.dataNode.id);
    if (details?.object) {
      objectDetail = details;
      updateInfoTableItems();
    } else {
      items = null;
    }
  }

  function getObjectPath(objectDetail: DatadocsObjectNodeDetails) {
    const { object, path } = objectDetail;
    let currentId = object.id;
    let pathUrl = "";
    let isPathValid = false;

    for (let i = 0; i < path.length; i++) {
      const currentObject = path.find((o) => o.id === currentId);
      if (!currentObject) {
        break;
      }

      pathUrl = "/" + currentObject.name + pathUrl;
      if (currentObject.parent) {
        currentId = currentObject.parent;
      } else {
        isPathValid = true;
        break;
      }
    }

    return isPathValid ? pathUrl : "";
  }

  function updateInfoTableItems() {
    nodeType = objectDetail.object.type;
    nodeName = objectDetail.object.name;

    if (nodeType === "fd") {
      items = [
        {
          title: "Type",
          value: "Folder",
        },
        {
          title: "Date created",
          value: getCustomDateTimeString(
            objectDetail.object.createdAt,
            "MMM dd, yyyy at h:mmam/pm",
          ),
        },
        {
          title: "Files contained",
          value: objectDetail.numberOfWorkbooks + "",
        },
        { title: "Path", value: getObjectPath(objectDetail) },
      ];
    } else {
      items = [
        {
          title: "Type",
          value: "Datadoc",
        },
        {
          title: "Date modified",
          value: getCustomDateTimeString(
            objectDetail.object.updatedAt,
            "MMM dd, yyyy at h:mmam/pm",
          ),
        },
        {
          title: "Last opened",
          value: getTimeDifference(objectDetail.object.lastOpened),
        },
        { title: "Total sheets", value: objectDetail.numberOfWorksheets + "" },
      ];
    }
  }

  onMount(() => {
    stateManager.addListener("refresh", loadNodeDetailsData);
    return () => {
      stateManager.removeListener("refresh", loadNodeDetailsData);
    };
  });

  $: singleSelection = selectionCount === 1;
  $: if (data && singleSelection) {
    loadNodeDetailsData();
  }
  $: if (data) {
    nodeType = data.dataNode.type;
    nodeName = data.name;
  }
  $: if ($datadocsObjectDetailsMapStore && selectionCount <= 1) {
    updateObjectDetailsUI();
  }
</script>

{#if data}
  <div class="node-detail-container flex flex-col h-full text-13px">
    {#if selectionCount > 1}
      <div class="p-3 font-medium">{selectionCount} items selected</div>
    {:else}
      <div
        class="flex-grow-0 flex-shrink-0 flex flex-row items-center px-1 py-0.5 bg-light-50"
      >
        <DetailHeader nodeId={data.dataNode.id} {nodeName} {nodeType} />
      </div>

      {#if items && items.length > 0}
        <div
          class="flex-grow flex-shrink flex flex-col justify-between px-3 pb-3 overflow-y-auto"
        >
          <div class="py-2.5">
            <InfoTable {items} />
          </div>

          {#if nodeType === "wb"}
            <OpenWorkbook objectId={data.dataNode.id} />
          {/if}
        </div>
      {/if}
    {/if}
  </div>
{/if}

<style lang="postcss">
  .node-detail-container {
    box-shadow: 0px -3px 8px -3px rgba(55, 84, 170, 0.16);
  }

  .node-detail-container :global(*) {
    @apply select-text;
  }
</style>
