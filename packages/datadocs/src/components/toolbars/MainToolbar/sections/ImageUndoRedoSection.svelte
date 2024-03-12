<script lang="ts">
  import UndoRedoDropdown from "../dropdowns/UndoRedoDropdown/UndoRedoDropdown.svelte";
  import { handleRedo, handleUndo } from "../../../../app/store/store-toolbar";
  import ToolbarSplitButton from "../buttons/ToolbarSplitButton.svelte";
  import {
    HISTORY_ACTION_TYPE_REDO,
    HISTORY_ACTION_TYPE_UNDO,
  } from "../../../panels/History/types/constants";
</script>

<ToolbarSplitButton
  icon="undo"
  tooltip="Undo"
  dropdownComponent={UndoRedoDropdown}
  dropdownProps={{ type: HISTORY_ACTION_TYPE_UNDO }}
  on:click={handleUndo}
/>

<ToolbarSplitButton
  icon="redo"
  tooltip="Redo"
  dropdownComponent={UndoRedoDropdown}
  dropdownProps={{ type: HISTORY_ACTION_TYPE_REDO }}
  on:click={handleRedo}
/>
