<script lang="ts">
  import ToolbarButton from "../buttons/ToolbarButton.svelte";
  import ClearCellsDropdown from "../dropdowns/ClearCellsDropdown/ClearCellsDropdown.svelte";
</script>

<ToolbarButton
  icon="insert-cells"
  hasArrow={true}
  tooltip="Insert Cells"
/>

<ToolbarButton
  icon="delete-cells"
  hasArrow={true}
  tooltip="Delete Cells"
/>

<ToolbarButton
  isDropdownChild={true}
  icon="clear-cells"
  hasArrow={true}
  tooltip="Clear"
  disabledTooltipOnActive
  dropdownComponent={ClearCellsDropdown}
/>