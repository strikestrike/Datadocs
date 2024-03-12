<script lang="ts">
  import Icon from "../../../common/icons/Icon.svelte";

  export let label: string;
  export let prefixIcon: string = null;
  export let hasTickSign: boolean = false;
  export let styleClass: string = "";
</script>

<div class="flex flex-row items-center w-full pl-3.5 pr-2 py-1.5 gap-1 {styleClass}">
  {#if prefixIcon}
    <Icon icon={prefixIcon} size="20px" />
  {/if}

  <div
    class="flex-grow flex-shrink font-medium overflow-hidden overflow-ellipsis whitespace-nowrap leading-5 text-13px"
    data-grideditorcompanion="true"
  >
    {@html label}
  </div>

  <Icon icon={hasTickSign ? "top-menu-item-tick" : "empty-rect"} size="20px" />
</div>
