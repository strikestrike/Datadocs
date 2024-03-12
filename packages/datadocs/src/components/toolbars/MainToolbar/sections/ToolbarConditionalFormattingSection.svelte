<script lang="ts">
  import ToolbarButton from "../buttons/ToolbarButton.svelte";
  import ConditionalFormattingDropdown from "../dropdowns/ConditionalFormattingDropdown/ConditionalFormattingDropdown.svelte";
  import CellStyleDropdown from "../dropdowns/CellStyleDropdown/CellStyleDropdown.svelte";
  import AlternatingColorDropdown from "../dropdowns/AlternatingColorDropdown/AlternatingColorDropdown.svelte";
</script>

<ToolbarButton
  icon="conditional-formating"
  isDropdownChild
  hasArrow
  tooltip="Conditional formatting"
  disabledTooltipOnActive
  dropdownComponent={ConditionalFormattingDropdown}
/>

<ToolbarButton
  icon="alternative-color"
  activeIcon="alternative-color"
  isDropdownChild
  hasArrow
  tooltip="Alternating colors"
  disabledTooltipOnActive
  dropdownComponent={AlternatingColorDropdown}
/>

<ToolbarButton
  icon="cell-style"
  activeIcon="cell-style"
  isDropdownChild
  hasArrow
  tooltip="Cell style"
  disabledTooltipOnActive
  dropdownComponent={CellStyleDropdown}
/>
