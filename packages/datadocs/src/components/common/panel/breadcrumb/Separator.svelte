<script lang="ts">
  import type { BreadcrumbSeparator } from "./type";
  import Icon from "../../icons/Icon.svelte";

  export let data: BreadcrumbSeparator;
</script>

<div
  class="flex-grow-0 flex-shrink-0 flex flex-row items-center justify-center w-4 text-dark-50"
>
  {#if data === "panel-breadcrumb-separator"}
    <Icon
      icon="panel-breadcrumb-separator"
      width="7px"
      height="10px"
      fill="none"
    />
  {:else if data === "panel-breadcrumb-slash-separator"}
    <Icon
      icon="panel-breadcrumb-slash-separator"
      width="5px"
      height="13px"
      fill="none"
    />
  {/if}
</div>
