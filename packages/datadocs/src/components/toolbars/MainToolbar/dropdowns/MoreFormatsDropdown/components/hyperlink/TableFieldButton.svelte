<script lang="ts">
  import Icon from "../../../../../../common/icons/Icon.svelte";
  import { getDataTypeIcon } from "../../../../../../common/icons/utils";

  export let label: string;
</script>

<div class="flex flex-row items-center gap-1">
  <div>
    <Icon icon={getDataTypeIcon("string")} width="34px" height="18px" />
  </div>

  <div
    style="width: calc(100% - 38px);max-width: calc(100% - 38px);"
    class="overflow-hidden overflow-ellipsis"
  >
    {label}
  </div>
</div>
