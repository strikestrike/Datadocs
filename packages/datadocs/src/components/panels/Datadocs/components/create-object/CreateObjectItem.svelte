<script lang="ts">
  import Icon from "../../../../common/icons/Icon.svelte";

  export let label: string;
  export let icon: string;
</script>

<div
  class="w-full flex flex-row items-center px-3.5 py-1.5 min-w-[200px] text-13px gap-1 text-dark-200 font-medium"
>
  <Icon {icon} size="20px" />
  <div class="flex-grow">{label}</div>
</div>
