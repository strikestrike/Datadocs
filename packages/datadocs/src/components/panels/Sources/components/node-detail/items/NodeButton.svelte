<script lang="ts">
  export let name: string;
  export let action: Function;

  function handleClick() {
    if (action) {
      action();
    }
  }
</script>

<div class="flex w-full items-center justify-center gap">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    on:click={handleClick}
    class="px-8 py-4 w-7/8 rounded-lg bg-indigo-500 text-center text-[13px] text-white font-normal cursor-pointer"
  >
    {name}
  </div>
</div>
