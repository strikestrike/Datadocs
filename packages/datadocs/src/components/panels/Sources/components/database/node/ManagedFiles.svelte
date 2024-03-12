<script lang="ts">
  import { getContext } from "svelte";
  import type { Node } from "../../../../../common/file-system/fileSystemStateManager";
  import type { DatabaseNodeItem } from "../../../../../../app/store/panels/sources/type";
  import type { SourcePanelAction } from "../../../manager/action";
  import {
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT,
    DATABASE_STATE_MANAGER_CONTEXT,
  } from "../../../constant";
  import SourceNode from "../../SourceNode.svelte";
  import PanelNodeElement from "../../../../../common/panel/PanelNodeElement.svelte";
  import Icon from "../../../../../common/icons/Icon.svelte";
  import type { SourceStateManager } from "../../../manager/sourceStateManager";

  export let node: Node<DatabaseNodeItem>;
  const databasePanelActions: SourcePanelAction = getContext(
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT
  );
  const databaseStateManager: SourceStateManager<DatabaseNodeItem> = getContext(
    DATABASE_STATE_MANAGER_CONTEXT
  );

  function handleClick(event: Event) {
    event.stopPropagation();
    databasePanelActions.openNode(node.id);
  }
</script>

<SourceNode {handleClick}>
  <PanelNodeElement label={node.name} moreButtonItems={[]}>
    <div slot="icon">
      <Icon icon={databaseStateManager.getNodeIcon(node.id)} size="20px" />
    </div>
  </PanelNodeElement>
</SourceNode>
