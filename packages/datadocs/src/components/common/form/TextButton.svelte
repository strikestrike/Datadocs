<script lang="ts">
  export let disabled: boolean = false;
  export let color:
    | "primary"
    | "secondary"
    | "warn"
    | "light-warn"
    | "success"
    | "teal" = "primary";
  export let align: "start" | "center" | "end" = "center";

  let className: string = "";
  export { className as class };
</script>

<button
  class="{className} text-{color} focusable justify-{align}"
  class:disabled
  {...$$restProps}
  on:click
  on:keydown
  on:keyup
>
  <slot />
</button>

<style lang="postcss">
  button {
    @apply flex flex-row items-center bg-primary-datadocs-blue rounded py-2 px-4 text-white border-0 font-medium;
    outline: reset;
  }

  button:hover,
  button.selected {
    background-color: #08b9ff;
    box-shadow: 0px 2px 6px rgba(8, 185, 255, 0.2);
  }

  button.disabled {
    box-shadow: none;
    pointer-events: none;
  }

  button.primary.disabled {
    @apply bg-opacity-60;
  }

  button.secondary {
    @apply bg-light-50 text-dark-50;
  }

  button.secondary:hover,
  button.secondary.selected {
    background-color: #f0f0f0;
    box-shadow: none;
  }

  button.warn {
    @apply bg-tertiary-error;
  }

  button.light-warn {
    @apply bg-tertiary-light-error;
  }

  button.success {
    @apply bg-tertiary-success text-white;
  }

  button.teal {
    @apply bg-tertiary-teal;
  }

  button.warn:hover,
  button.warn.selected {
    background-color: #cc3c1b;
    box-shadow: 0px 2px 6px rgba(230, 69, 31, 0.2);
  }

  button.light-warn:hover,
  button.warn.selected {
    background-color: #ea5921;
    box-shadow: 0px 2px 6px rgba(230, 69, 31, 0.2);
  }

  button.teal:hover,
  button.teal.selected {
    background-color: #46a8c6;
    box-shadow: 0px 2px 6px rgba(70, 189, 198, 0.2);
  }
</style>
