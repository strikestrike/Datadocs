<script lang="ts">
  import ToolbarButton from "../buttons/ToolbarButton.svelte";
  import LocaleDropdown from "../dropdowns/LocaleDropdown/LocaleDropdown.svelte";
</script>

<ToolbarButton
  isDropdownChild={true}
  icon="home"
  hasArrow={true}
  tooltip="Locale"
  disabledTooltipOnActive
  dropdownComponent={LocaleDropdown}
/>
