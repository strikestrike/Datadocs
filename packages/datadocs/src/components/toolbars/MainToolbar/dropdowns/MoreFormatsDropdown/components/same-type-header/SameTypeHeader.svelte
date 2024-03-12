<script lang="ts">
  import Icon from "../../../../../../common/icons/Icon.svelte";
  import { getDataTypeIcon } from "../../../../../../common/icons/utils";
  import { isValidMenuType } from "../../util";

  export let dataType: string;

  const title = isValidMenuType(dataType) ? dataType : "";
  

  function getHeaderIcon(dataType: string) {
    if (dataType === "number") {
      // type int icon is used for number format menu
      return getDataTypeIcon("int");
    }
    return getDataTypeIcon(dataType);
  }

  // $: icon = getHeaderIcon(dataType);
</script>

<div>{title}</div>
<!-- 
<div
  class="flex flex-row items-center py-1.5 px-2.5 bg-light-50 text-[13px] font-medium"
>
  <Icon {icon} width="30px" height="18px" />
  <div>{title}</div>
</div>

<div class="border-b border-light-100 h-1px mb-1.5" />
-->

<style lang="postcss">
  div {
    @apply mx-3.5 mt-2.5 mb-0.5;
    @apply font-medium text-11px text-dark-50 uppercase;
    letter-spacing: 0.05em;
  }
</style>
