<script lang="ts">
  import { DropdownWrapper } from "../../dropdown";
  import Icon from "../../icons/Icon.svelte";
  import BreadscrumbDropdown from "./breadscrumb-dropdown/BreadscrumbDropdown.svelte";
  import type { BreadcrumbDropdownItem, BreadcrumbItem } from "./type";

  export let active: boolean;
  export let data: BreadcrumbItem;
  export let width: number;

  let element: HTMLElement;

  let open: boolean = false;
  let dropdownItems: BreadcrumbDropdownItem[] = data.getDropdownChildren
    ? data.getDropdownChildren()
    : [];

  function toggleDropdownOpen() {
    open = !open;
  }

  function handleMouseDown() {
    function handleMouseUp() {
      document.removeEventListener("mouseup", handleMouseUp);
    }

    document.addEventListener("mouseup", handleMouseUp);

    // in case button control a dropdown
    toggleDropdownOpen();
  }
</script>

<DropdownWrapper bind:show={open}>
  <div
    class="p-1 rounded-s gap-1 flex flex-row items-center cursor-pointer dropdown-content"
    class:active={open}
    bind:this={element}
    on:mousedown={handleMouseDown}
    slot="button"
  >
    {#if data.prefixIcon}
      <Icon icon={data.prefixIcon} size="16px" />
    {/if}
    <div
      class="flex-grow-0 flex-shrink-0 overflow-hidden text-dark-50 text-center overflow-ellipsis"
      class:text-dark-300={active}
      style="width: {width}px; max-width: {width}px;"
    >
      {data.name}
    </div>
    <Icon icon="tw-expand-arrow" size="10px" />
  </div>
  <svelte:component
    this={BreadscrumbDropdown}
    slot="content"
    {...{ breadscrumbItems: dropdownItems, activeId: data && data.id }}
  />
</DropdownWrapper>

<style lang="postcss">
  .dropdown-content {
    background-color: #ffffff;
  }

  .dropdown-content.active {
    box-shadow: 1px 2px 6px 0px #3754aa29;
  }
</style>
