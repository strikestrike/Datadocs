<script lang="ts">
  import Icon from "../icons/Icon.svelte";

  export let disabled = false;
  export let color:
    | "primary"
    | "primary-accent"
    | "secondary"
    | "warn"
    | "light-warn"
    | "success"
    | "teal" = "primary";
  export let align: "start" | "center" | "end" = "center";
  export let spacing = "py-2 px-4";

  let className = "";
  export { className as class };
  let selected = false;
</script>

<button
  class="button {color} focusable justify-{align} {spacing} {className}"
  class:disabled
  class:selected
  {...$$restProps}
  on:click
  on:keydown
  on:keyup
>
  <slot />
</button>

<style lang="postcss">
  .button {
    @apply my-0 flex flex-row items-center bg-primary-datadocs-blue rounded text-white border-0 font-medium outline-none;
    outline: reset;

    &.activated {
      @apply border-light-100;
    }

    &:hover,
    &.selected {
      background-color: #08b9ff;
      box-shadow: 0px 2px 6px rgba(8, 185, 255, 0.2);
    }

    &.disabled {
      box-shadow: none;
      pointer-events: none;
    }

    &.primary.disabled,
    &.primary-accent.disabled {
      @apply bg-opacity-60;
    }

    &.secondary {
      @apply bg-light-50 text-dark-50;
    }

    &.secondary:hover,
    &.secondary.selected {
      background-color: #f0f0f0;
      box-shadow: none;
    }

    &.primary-accent {
      @apply bg-primary-indigo-blue;
    }

    &.warn {
      @apply bg-tertiary-error;
    }

    &.light-warn {
      @apply bg-tertiary-light-error;
    }

    &.success {
      @apply bg-tertiary-success text-white;
    }

    &.teal {
      @apply bg-tertiary-teal;
    }

    &.warn:hover,
    &.warn.selected {
      background-color: #cc3c1b;
      box-shadow: 0px 2px 6px rgba(230, 69, 31, 0.2);
    }

    &.light-warn:hover,
    &.warn.selected {
      background-color: #ea5921;
      box-shadow: 0px 2px 6px rgba(230, 69, 31, 0.2);
    }

    &.teal:hover,
    &.teal.selected {
      background-color: #46a8c6;
      box-shadow: 0px 2px 6px rgba(70, 189, 198, 0.2);
    }

    &.disabled:focus {
      filter: brightness(95%);
    }
  }
</style>
