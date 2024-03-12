<script lang="ts">
  import Icon from "../../../../common/icons/Icon.svelte";
</script>

<div class="fs-empty-container">
  <div class="fs-empty-content">
    <div><Icon icon="tw-database-empty" width="70px" height="80px" /></div>
    <div class="fs-empty-title">Database is empty</div>
    <div class="fs-empty-description">Start modifying the imported files.</div>
  </div>
</div>

<style lang="postcss">
  .fs-empty-container {
    @apply flex h-full justify-center w-full;
  }

  .fs-empty-content {
    @apply flex flex-col justify-center items-center;
  }

  .fs-empty-title {
    @apply text-15px font-semibold leading-[22px];
  }

  .fs-empty-description {
    @apply text-11px font-normal leading-[16px] text-dark-50;
  }
</style>
