<script lang="ts">
  import Icon from "../../icons/Icon.svelte";
  import type { BreadcrumbItem } from "./type";

  export let data: BreadcrumbItem;

  function onHomeClick() {
    if (typeof data.action === "function") {
      data.action();
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="text-dark-50 cursor-pointer hover:text-primary-indigo-blue"
  on:click={onHomeClick}
>
  <Icon icon={data.prefixIcon ?? "panel-breadcrumb-home"} size="16px" />
</div>
