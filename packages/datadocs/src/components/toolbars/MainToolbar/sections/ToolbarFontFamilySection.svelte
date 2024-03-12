<script lang="ts">
  import ToolbarButton from "../buttons/ToolbarButton.svelte";
  import FontFamilyDropdown from "../dropdowns/FontFamilyDropdown/FontFamilyDropdown.svelte";
  import {
    GRID_DEFAULT_FONT_FAMILY,
  } from "../../../../app/store/store-toolbar";
  import { fontFamilyValue } from "../../../../app/store/writables";
  import { applyStyleProTipStore } from "../dropdowns/ApplyStyleProTip";

  $: font = $fontFamilyValue.value;
  $: showApplyStyleProTip = $applyStyleProTipStore;
</script>

<ToolbarButton
  hasArrow={true}
  isDropdownChild
  tooltip="Font"
  disabledTooltipOnActive
  dropdownComponent={FontFamilyDropdown}
  {showApplyStyleProTip}
>
  <div
    class="inline-block h-5 w-[71px] whitespace-nowrap overflow-hidden overflow-ellipsis text-13px"
  >
    <!-- Show default font if the current font family is grid default font -->
    {font === GRID_DEFAULT_FONT_FAMILY ? "Default (Arial)" : font}
  </div>
</ToolbarButton>
