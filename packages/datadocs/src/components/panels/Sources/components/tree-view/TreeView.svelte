<script lang="ts">
  import type { DatabaseNode, ColumnTreeNode, FileSystemNode } from "./type";
  import DatabaseTreeNode from "./tree-node/DatabaseTreeNode.svelte";
  import ColumnTypeTreeNode from "./tree-node/ColumnTypeTreeNode.svelte";
  import FileSystemTreeNode from "./tree-node/FileSystemTreeNode.svelte";
  import TreeViewStyle from "./TreeViewStyle.svelte";

  export let data: DatabaseNode | ColumnTreeNode | FileSystemNode;

  function isDatabaseNode(
    data: DatabaseNode | ColumnTreeNode | FileSystemNode
  ): data is DatabaseNode {
    return (
      data.type === "databaseroot" ||
      data.type === "dbschema" ||
      data.type === "dbcollection" ||
      data.type === "dbtable" ||
      data.type === "dbview"
    );
  }

  function isFileSystemNode(
    data: DatabaseNode | ColumnTreeNode | FileSystemNode
  ): data is FileSystemNode {
    return (
      data.type === "fsfolder" ||
      data.type === "fsexcel" ||
      data.type === "fssheet" ||
      data.type === "fscsv" ||
      data.type === "fsjson"
    );
  }
</script>

{#if isDatabaseNode(data)}
  <div class="source-panel-tree-view database-tree-view">
    <ul><DatabaseTreeNode {data} /></ul>
  </div>
{:else if isFileSystemNode(data)}
  <div class="source-panel-tree-view fs-tree-view">
    <ul><FileSystemTreeNode {data} /></ul>
  </div>
{:else}
  <div class="source-panel-tree-view column-type-tree-view">
    <ul>
      {#each data.children as child}
        <ColumnTypeTreeNode data={child} />
      {/each}
    </ul>
  </div>
{/if}

<TreeViewStyle />
