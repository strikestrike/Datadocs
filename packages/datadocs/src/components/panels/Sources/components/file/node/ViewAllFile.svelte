<script lang="ts">
  import type { Node } from "../../../../../common/file-system/fileSystemStateManager";
  import PanelNodeElement from "../../../../../common/panel/PanelNodeElement.svelte";
  import { getContext } from "svelte";
  import { FILE_SYSTEM_ACTION_CONTEXT } from "../../../../../common/file-system/flat-file-system/constant";
  import type { SourcePanelAction } from "../../../manager/action";
  import type { MenuItemType } from "../../../../../common/menu";
  import SourceNode from "../../SourceNode.svelte";

  export let node: Node<any>;
  const className = "view-all-files";

  const fileSystemActions: SourcePanelAction = getContext(
    FILE_SYSTEM_ACTION_CONTEXT,
  );

  function handleClick() {
    fileSystemActions.openNode(node.id);
  }

  // More options
  const moreButtonItems: MenuItemType[] = [];
</script>

<SourceNode {handleClick}>
  <PanelNodeElement
    {className}
    label={node.name}
    {moreButtonItems}
    selected={node.selected}
  >
    <div slot="icon" />
  </PanelNodeElement>
</SourceNode>

<style lang="postcss">
  :global {
    .view-all-files .panel-node-label {
      @apply text-indigo-500;
    }
  }
</style>
