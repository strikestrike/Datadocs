<script lang="ts">
  export let title: string;

  export let spacing = "mb-0";
</script>

<div class={spacing}>{title}</div>

<style lang="postcss">
  div {
    @apply uppercase text-dark-50 font-semibold text-11px;
    line-height: 17px;
  }
</style>
