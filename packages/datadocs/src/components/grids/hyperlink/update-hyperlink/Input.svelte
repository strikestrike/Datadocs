<script lang="ts">
  export let value = "";
  export let placeholder = "";
  export let label = "";
  export let inputElement: HTMLInputElement = null;
</script>

<div>
  {#if label}
    <div class="text-dark-50 text-11px font-semibold mb-0.5 uppercase">
      {label}
    </div>
  {/if}

  <div>
    <input
      {...$$restProps}
      bind:this={inputElement}
      bind:value
      type="text"
      {placeholder}
    />
  </div>
</div>

<style lang="postcss">
  input {
    @apply border border-dark-50 outline-none rounded;
    @apply h-8 py-1 px-2 text-13px font-medium w-[250px];
  }
</style>
