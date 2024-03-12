<script lang="ts">
  export let inputElement: HTMLInputElement = null;
  export let title: string;
  export let value: string;
  export let placeholder: string = "";
</script>

<div
  class="flex flex-row items-center rounded border border-light-200 overflow-hidden text-12px w-[300px]"
>
  <div
    class="flex-grow-0 py-1.5 px-2 h-8 border-r border-light-200 text-dark-50"
  >
    {title}
  </div>

  <div class="flex-grow">
    <input
      bind:this={inputElement}
      class="py-1.5 px-2 h-8 w-full outline-none text-dark-100 bg-light-50"
      type="text"
      bind:value
      {placeholder}
    />
  </div>
</div>
