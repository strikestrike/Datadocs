<script>
  export let getSelectionLabel = undefined;
  export let item = undefined;
</script>

<div class="selection">
  {@html getSelectionLabel(item)}
</div>

<style lang="postcss">
  .selection {
    text-overflow: ellipsis;
    overflow-x: hidden;
    white-space: nowrap;

    font-style: normal;
    font-weight: 500;
    font-size: 15px;

    margin-right: 8px;
  }
</style>
