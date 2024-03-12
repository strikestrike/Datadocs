<script lang="ts">
  import Icon from "../../../common/icons/Icon.svelte";
  import tooltipAction from "../../../common/tooltip";

  export let icon: string;
  export let tooltip: string;
  export let disabled: boolean = false;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="control-button w-8 h-8 p-1.5 rounded-full cursor-pointer hover:bg-light-100"
  class:disabled
  data-grideditorcompanion="true"
  use:tooltipAction={{
    content: tooltip,
    disabled: false,
  }}
  on:click
>
  <Icon {icon} width="20px" height="20px" />
</div>

<style lang="postcss">
  .disabled {
    @apply pointer-events-none text-dark-50;
  }
</style>
