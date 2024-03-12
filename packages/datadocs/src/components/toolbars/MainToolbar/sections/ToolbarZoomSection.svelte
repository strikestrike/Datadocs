<script lang="ts">
  import ToolbarInputButton from "../buttons/ToolbarInputButton.svelte";
  import ZoomDropdown from "../dropdowns/ZoomDropdown/ZoomDropdown.svelte";
  import { changeZoomValue } from "../../../../app/store/store-toolbar";
  import { zoomValue } from "../../../../app/store/writables";
</script>

<ToolbarInputButton
  isDropdownChild={true}
  value="{$zoomValue.value}%"
  changeValue={changeZoomValue}
  inputWidth={36}
  tooltip="Zoom"
  dropdownComponent={ZoomDropdown}
/>
