<script lang="ts">
  import Icon from "../../icons/Icon.svelte";

  export let activated: boolean;
  export let disabled: boolean = false;
  export let selected: boolean = false;
  export let icon: string = "";
  export let iconOnly = false;
  export let smaller = false;

  let className: string = "";
  export { className as class };
</script>

<button
  class="button {className}"
  class:activated
  class:selected
  class:disabled
  class:smaller
  class:icon-only={iconOnly}
  class:justify-center={!icon}
  on:click
  on:keydown
  on:keyup
>
  {#if icon}
    <Icon
      {icon}
      size={smaller ? "24px" : "19px"}
      class={iconOnly ? "" : "mr-2"}
      fill="currentColor"
    />
  {/if}
  {#if !iconOnly}
    <slot />
  {/if}
</button>

<style lang="postcss">
  .button {
    @apply flex flex-row items-center rounded bg-transparent text-dark-200 text-[13px] font-normal border border-solid border-light-100 outline-none px-2 h-[36px] m-0;
    height: 36px;
  }

  .button.smaller {
    @apply text-[11px] p-1 h-[24px];
  }

  .button:focus-visible,
  .button:hover,
  .button.selected {
    @apply outline outline-primary-datadocs-blue;
  }

  .button.activated {
    @apply text-primary-datadocs-blue border-primary-datadocs-blue;
  }
</style>
