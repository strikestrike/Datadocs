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
      size={smaller ? "24px" : "18px"}
      class={iconOnly ? "" : "mr-2"}
      fill="currentColor"
    />
  {/if}
  {#if !iconOnly}
    <slot />
  {/if}

  <div class="tick-sign-container">
    <Icon icon="sort-tick-sign" size="6px"/>
  </div>
</button>

<style lang="postcss">
  .button {
    @apply relative flex flex-row items-center rounded bg-light-50 text-dark-200 text-13px leading-[20px] font-normal px-2 py-1 m-0;

    /* border style */
    @apply rounded outline-none;
    border: 2px solid transparent;
  }

  .button.smaller {
    @apply text-[11px] p-1 h-[24px];
  }

  .button:focus-visible,
  .button:hover,
  .button.selected,
  .button.activated {
    @apply border-primary-indigo-blue;
  }

  .button.activated {
    @apply font-medium bg-transparent;
    filter: drop-shadow(1px 2px 6px rgba(55, 84, 170, 0.2));
  }

  .tick-sign-container {
    @apply flex flex-row items-center justify-center opacity-0 pointer-event-none;
    @apply absolute w-3 h-3 rounded-full bg-primary-indigo-blue;
    top: -6px;
    right: -6px;
  }

  .activated .tick-sign-container {
    @apply opacity-100;
  }
</style>
