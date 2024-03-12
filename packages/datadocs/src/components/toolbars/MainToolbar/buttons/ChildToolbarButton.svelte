<script lang="ts">
  import ChildToolbarDropdow from "../dropdowns/ChildToolbarDropdown/ChildToolbarDropdown.svelte";
  import DropdownWrapper from "../../../common/dropdown/DropdownWrapper.svelte";
  import Icon from "../../../common/icons/Icon.svelte";
  import { childToolbarValue } from "../../../../app/store/writables";

  let show: boolean = false;

  function toggleOpenDropdown() {
    show = !show;
  }

  $: value = $childToolbarValue;
</script>

<DropdownWrapper bind:show>
  <div
    class="child-toolbar-button py-1 px-2 h-6 text-11px text-dark-200 font-medium flex flex-row items-center gap-2 border border-light-100 cursor-pointer"
    class:active={show}
    on:mousedown={toggleOpenDropdown}
    slot="button"
  >
    <div class="capitalize" style="width: 52px;">{value}</div>
    <div class="arrow-icon">
      <Icon
        icon="toolbar-arrow-dropdown"
        width="7px"
        height="4px"
        fill="currentColor"
      />
    </div>
  </div>

  <svelte:component this={ChildToolbarDropdow} slot="content" />
</DropdownWrapper>

<style lang="postcss">
  .child-toolbar-button {
    border-radius: 3px;
  }

  .child-toolbar-button:not(.active):hover {
    @apply bg-light-100 text-dark-300;
  }

  .active {
    @apply text-primary-datadocs-blue;
    background-color: rgba(59, 199, 255, 0.1);
  }

  .arrow-icon {
    @apply text-dark-50;
  }

  .active .arrow-icon {
    @apply text-primary-datadocs-blue;
  }
</style>
