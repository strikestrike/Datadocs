<script lang="ts">
  import { getDataTypeIcon } from "../../../../../../common/icons/utils";
  import Icon from "../../../../../../common/icons/Icon.svelte";

  export let key: string;
  export let dataType: string;
  export let style = "";

  const icon: string = getDataTypeIcon(dataType);
</script>

<div class="item-label flex-shrink flex-grow pl-2.5 pr-3.5 py-1.5" {style}>
  <div class="flex flex-row items-center gap-1">
    <div><Icon {icon} width="34px" height="18px" /></div>
    <div
      class="flex-grow flex-shrink max-w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-13px text-dark-200 font-medium"
    >
      <!-- {key + " this is a sample for long key "} -->
      {key}
    </div>
  </div>
</div>
