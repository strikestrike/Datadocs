<script lang="ts">
  import Icon from "../icons/Icon.svelte";

  export let message: string = "";
  /**
   * @todo Make sure correct colors are displayed work for success and error
   * types
   */
  export let type: "info" | "success" | "error" = "info";

  let className = "";
  export { className as class };

  $: icon = getIcon(type);

  function getIcon(boxType: typeof type) {
    switch (boxType) {
      case "info":
      case "success":
      case "error":
      default:
        return "alert-info";
    }
  }
</script>

<div class="alert-box-container {className} is-{type}">
  <Icon {icon} size="16px" class="flex-shrink-0" />

  <span class="message">
    <slot name="message">{message}</slot>
  </span>
</div>

<style lang="postcss">
  .alert-box-container {
    @apply flex flex-row px-2 py-1 items-center rounded text-primary-datadocs-blue;
    column-gap: 8px;

    > .message {
      @apply text-11px font-normal text-dark-200;
      line-height: normal;
    }

    &.is-info {
      background: rgba(59, 199, 255, 0.08);
    }
  }
</style>
