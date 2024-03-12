<script lang="ts">
  export let objectData: any = null;
  export let onObjectChange = (gridObject) => {};
</script>

<div class="object-slicer">
  <h3 class="object-slicer-label">{objectData.label}</h3>
  <div class="object-slicer-img">SLICER</div>
</div>

<style lang="postcss">
  .object-slicer {
    @apply px-3 py-0.5 bg-white border border-solid border-gray-300 rounded-lg;
    width: 200px;
    height: 200px;
  }

  .object-slicer-label {
    @apply my-2;
  }

  .object-slicer-img {
    @apply my-1;
  }
</style>
