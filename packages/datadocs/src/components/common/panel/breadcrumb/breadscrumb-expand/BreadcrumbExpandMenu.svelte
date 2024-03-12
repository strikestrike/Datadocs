<script lang="ts">
  import type { BreadcrumbItem, BreadcrumbSeparator } from "../type";
  import Separator from "../Separator.svelte";
  import BreadcrumbHome from "../BreadcrumbHome.svelte";
  import BreadcrumbPath from "../BreadcrumbPath.svelte";
  import Dropdown from "../../../dropdown/Dropdown.svelte";
  import type { DropdownTriggerRect } from "../../../dropdown/type";

  export let home: BreadcrumbItem = null;
  export let dropdownItem: BreadcrumbItem = null;
  export let paths: BreadcrumbItem[] = [];
  export let parentElement: HTMLElement;
  export let separator: BreadcrumbSeparator;
  export let onMouseOver = () => {};
  export let onMouseLeave = () => {};

  let triggerRect: DropdownTriggerRect = null;

  function onChange() {
    if (!parentElement) {
      triggerRect = null;
    }
    const { top, left, right, bottom } = parentElement.getBoundingClientRect();
    triggerRect = { top, left: left - 8, right, bottom };
  }

  $: lastPath = paths[paths.length - 1];
  $: parentElement, paths, onChange();
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if parentElement}
  <Dropdown
    wrapperElement={parentElement}
    triggerElement={null}
    {triggerRect}
    position="bottom"
    alignment="left"
    distanceToDropdown={8}
  >
    <div
      slot="content"
      class="layover-menu"
      on:mouseover={onMouseOver}
      on:mouseleave={onMouseLeave}
    >
      <BreadcrumbHome data={home} />

      {#if dropdownItem}
        <BreadcrumbPath
          active={paths.length === 0}
          data={dropdownItem}
          width={dropdownItem.width}
        />
      {/if}

      {#each paths as path (path.id)}
        <Separator data={separator} />
        <BreadcrumbPath
          active={path === lastPath}
          data={path}
          width={path.width}
        />
      {/each}
    </div>
  </Dropdown>
{/if}

<style lang="postcss">
  .layover-menu {
    @apply flex flex-row items-center text-12px px-2 py-1 bg-white rounded;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }
</style>
