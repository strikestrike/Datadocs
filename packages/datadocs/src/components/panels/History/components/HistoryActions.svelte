<script lang="ts">
  import Icon from "../../../common/icons/Icon.svelte";

  export let historySelect = (event: Event) => {};
</script>

<div class="history-actions">
  <div class="history-toggle" on:click={(event) => historySelect(event)}>
    <Icon icon={"layer-action-toggle"} size="12px" />
  </div>
</div>

<style lang="postcss">
  .history-actions {
    @apply flex;
  }

  .history-actions > div {
    @apply mx-0.5 cursor-pointer;
  }
</style>
