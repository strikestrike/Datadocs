<script lang="ts">
  import ApplyColumn from "../dropdowns/MoreFormatsDropdown/components/ApplyColumn.svelte";
  import { setApplyEntireColumn, shouldApplyEntireColumn } from "../../../../app/store/store-toolbar";
  import { applyEntireColumnStore } from "../../../../app/store/writables";

  $: checked = $applyEntireColumnStore;

  function onChecked(event) {
    const value = event.detail.value;
    if (value !== shouldApplyEntireColumn()) {
      setApplyEntireColumn(value);
    }
  }
</script>

<ApplyColumn class="font-medium text-13px text-dark-300" size={16} {checked} on:checked={onChecked} />
