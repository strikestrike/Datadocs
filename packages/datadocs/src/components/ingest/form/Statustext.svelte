<script lang="ts">
  import type { Writable } from "svelte/store";
  export let status: Writable<string|Error>;

  let statusText = '';
  let className = '';
  $: {
    const st = $status;
    if(st && st instanceof Error) {
      className = 'text-red-500';
      statusText = st.message;
    } else {
      statusText = String(st || '');
    }
  }

</script>

<div class={className}>{statusText}</div>

<style lang="postcss">
</style>
