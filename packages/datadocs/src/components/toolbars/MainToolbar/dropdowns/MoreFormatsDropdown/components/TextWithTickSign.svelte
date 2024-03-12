<script lang="ts">
  import Icon from "../../../../../common/icons/Icon.svelte";

  export let isActive: boolean = false;
  export let content: string;
  export let hint: string = "";
  export let hintTextStyle: string = "";
</script>

<div
  class="w-full max-w-full flex flex-row items-center"
  class:active={isActive}
>
  <div
    class="left-content flex-shrink flex-grow min-w-10 flex flex-row items-center"
  >
    <div class="tick-sign flex-shrink-0 mr-0.5 opacity-0">
      <Icon icon="top-menu-item-tick" size="20px" />
    </div>

    <div class="flex-shrink flex-grow min-w-4 flex flex-row">
      <span
        class="w-full max-w-full text-dark-300 h-5 font-normal whitespace-nowrap overflow-hidden overflow-ellipsis"
      >
        {@html content}
      </span>
    </div>
  </div>

  <div
    class="right-content flex-shrink-0 flex-grow-0 flex flex-row items-center h-5 font-normal text-dark-50 whitespace-nowrap"
    style={hintTextStyle}
    class:pl-2={!!hint}
  >
    {hint}
  </div>
</div>

<style lang="postcss">
  .active .tick-sign {
    @apply opacity-100;
  }

  .active .left-content :global(*) {
    @apply !text-primary-datadocs-blue;
  }
</style>
