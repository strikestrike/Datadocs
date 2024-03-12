<script lang="ts">
  import { getContext, setContext } from "svelte";
  import FlatFileSystem from "../../../../common/file-system/flat-file-system/FlatFileSystem.svelte";
  import {
    FILE_SYSTEM_ACTION_CONTEXT,
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  } from "../../../../common/file-system/flat-file-system/constant";
  import type { SourceStateManager } from "../../manager/sourceStateManager";
  import type { SourceNodeItem } from "../../../../../app/store/panels/sources/type";
  import type { SourcePanelAction } from "../../manager/action";
  import {
    REMOTE_FILES_SOURCE_PANEL_ACTION_CONTEXT,
    REMOTE_FILES_SYSTEM_MANAGER_CONTEXT,
  } from "../../constant";

  const remoteFileStateManager: SourceStateManager<SourceNodeItem> = getContext(
    REMOTE_FILES_SYSTEM_MANAGER_CONTEXT,
  );

  const remoteFileActions: SourcePanelAction = getContext(
    REMOTE_FILES_SOURCE_PANEL_ACTION_CONTEXT,
  );

  setContext(FILE_SYSTEM_ACTION_CONTEXT, remoteFileActions);
  setContext(FILE_SYSTEM_STATE_MANAGER_CONTEXT, remoteFileStateManager);
</script>

<FlatFileSystem
  fileSystemActions={remoteFileActions}
  stateManager={remoteFileStateManager}
/>
