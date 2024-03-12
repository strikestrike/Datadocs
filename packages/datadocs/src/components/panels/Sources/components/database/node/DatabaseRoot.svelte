<script lang="ts">
  import { getContext } from "svelte";
  import type {
    DatabaseNodeItem,
  } from "../../../../../../app/store/panels/sources/type";
  import type { Node } from "../../../../../common/file-system/fileSystemStateManager";
  import {
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
    type MenuItemType,
  } from "../../../../../common/menu";
  import PanelNodeElement from "../../../../../common/panel/PanelNodeElement.svelte";
  import type { SourcePanelAction } from "../../../manager/action";
  import {
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT,
    DATABASE_STATE_MANAGER_CONTEXT,
  } from "../../../constant";
  import SourceNode from "../../SourceNode.svelte";
  import Icon from "../../../../../common/icons/Icon.svelte";
  import type DatabaseStateManager from "../../../manager/databaseStateManager";

  const databasePanelActions: SourcePanelAction = getContext(
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT
  );
  const databaseStateManager: DatabaseStateManager<DatabaseNodeItem> =
    getContext(DATABASE_STATE_MANAGER_CONTEXT);

  function getPanelIcon(): string {
    return databaseStateManager.getNodeIcon(node.id);
  }

  async function handleEditNodeName(name: string) {
    databasePanelActions.renameNode(node.id, name);
  }

  // Editing name
  let editingName: boolean;
  function handleClick(event: Event) {
    event.stopPropagation();
    if (!editingName) {
      databasePanelActions.openNode(node.id);
    }
  }

  // More buttons
  let triggerEdit: () => void;
  const moreButtonItems: MenuItemType[] = [
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Info",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: () => {
        databasePanelActions.showDetail(node.id);
      },
    },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Edit Connection",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: () => {
        // Do Editing Connection
      },
    },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Rename",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: () => {
        triggerEdit();
      },
    },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Remove Connection",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      status: "warning",
      action: () => {
        databasePanelActions.deleteNode(node.id);
      },
    },
  ];

  export let node: Node<DatabaseNodeItem>;
</script>

<SourceNode {handleClick}>
  <PanelNodeElement
    bind:triggerEdit
    bind:editing={editingName}
    label={node.name}
    {handleEditNodeName}
    {moreButtonItems}
  >
    <div slot="icon">
      <Icon icon={getPanelIcon()} size="20px" />
    </div>
  </PanelNodeElement>
</SourceNode>
