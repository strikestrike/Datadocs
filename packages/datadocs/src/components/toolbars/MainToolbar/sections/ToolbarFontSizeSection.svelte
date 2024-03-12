<script lang="ts">
  import ToolbarInputButton from "../buttons/ToolbarInputButton.svelte";
  import FontSizeDropdown from "../dropdowns/FontSizeDropdown/FontSizeDropdown.svelte";
  import { changeFontSizeValue } from "../../../../app/store/store-toolbar";
  import { fontSizeValue } from "../../../../app/store/writables";
  import { applyStyleProTipStore } from "../dropdowns/ApplyStyleProTip";

  $: showApplyStyleProTip = $applyStyleProTipStore;
</script>

<ToolbarInputButton
  isDropdownChild={true}
  value={$fontSizeValue.value.toString()}
  changeValue={changeFontSizeValue}
  inputWidth={28}
  tooltip="Font size"
  dropdownComponent={FontSizeDropdown}
  {showApplyStyleProTip}
/>
