<script lang="ts">
  import { getContext, onMount } from "svelte";
  import SearchBox from "../../../common/panel/SearchBox.svelte";
  import type { SourcePanelAction } from "../manager/action";
  import {
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT,
    UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT,
  } from "../constant";
  import type { SourceNodeItem } from "../../../../app/store/panels/sources/type";
  import type { SourceStateManager } from "../manager/sourceStateManager";

  export let rootNode: ReturnType<
    SourceStateManager<SourceNodeItem>["getUIRoot"]
  >;
  export let rootType: string;

  const databaseActions: SourcePanelAction = getContext(
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT,
  );
  const uploadedFileActions: SourcePanelAction = getContext(
    UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT,
  );
  let actions: SourcePanelAction = getSourceAction();

  function getSourceAction(): SourcePanelAction {
    return rootType === "database" ? databaseActions : uploadedFileActions;
  }

  function handleSearch(value: string) {
    if (rootNode === null) {
      databaseActions.search(value, null);
      uploadedFileActions.search(value, null);
    } else {
      actions.search(value, null, rootNode.id);
    }
  }

  $: if (rootNode) {
    actions = getSourceAction();
  }
</script>

<SearchBox onSearch={handleSearch} />
