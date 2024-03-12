<script lang="ts">
  import DropdownWrapper from "../../../../../../../common/dropdown/DropdownWrapper.svelte";
  import Icon from "../../../../../../../common/icons/Icon.svelte";
  import { getDataTypeIcon } from "../../../../../../../common/icons/utils";
  import SelectTypeItem from "./SelectTypeItem.svelte";

  export let types: string[];
  export let activeType: string;

  let show: boolean = false;

  function selectType(type: string) {
    activeType = type;
    show = false;
  }

  function toggleOpenDropdown() {
    show = !show;
  }

  $: typeIcon = getDataTypeIcon(activeType);
</script>

{#if types.length > 0}
  <!-- <div class="w-full"> -->
    <DropdownWrapper distanceToDropdown={1} autoWidth={true} bind:show>
      <div
        class="dropdown-button w-full"
        class:active={show}
        on:mousedown={toggleOpenDropdown}
        slot="button"
      >
        <div class="flex flex-row items-center gap-1">
          <div>
            <Icon icon={typeIcon} width="34px" height="18px" />
          </div>

          <div style="width: calc(100% - 50px);max-width: calc(100% - 50px);">
            <div class="overflow-hidden overflow-ellipsis">{activeType}</div>
          </div>

          <div class:active={show} class="arrow-dropdown-icon">
            <Icon
              icon="toolbar-arrow-dropdown"
              width="7px"
              height="4px"
              fill="currentColor"
            />
          </div>
        </div>
      </div>

      <div class="dropdown-menu" slot="content">
        {#each types as type}
          <SelectTypeItem {type} {selectType} />
        {/each}
      </div>
    </DropdownWrapper>
  <!-- </div> -->
{/if}

<style lang="postcss">
  .dropdown-button {
    @apply bg-white rounded w-full px-2.5 py-1.5 cursor-pointer text-13px font-medium;
    @apply border border-light-100;
    /* width: 280px; */
  }

  .dropdown-button:hover,
  .dropdown-button.active {
    box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.16);
  }

  .dropdown-menu {
    @apply bg-white rounded py-1.5;
    max-height: 100%;
    overflow-y: auto;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .arrow-dropdown-icon {
    @apply text-dark-50;
  }
</style>
