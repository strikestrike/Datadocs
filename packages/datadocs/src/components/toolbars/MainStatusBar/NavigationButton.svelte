<script lang="ts">
  import Icon from "../../common/icons/Icon.svelte";
  import type { ScrollDirection } from "./utils";

  export let handleNavigation: (direction: ScrollDirection) => void;
  export let canScrollLeft = false;
  export let canScrollRight = false;

  const activeIconColor = "#A7B0B5";
  const inactiveIconColor = "#E6E6E6";
</script>

<div class="flex flex-row items-center mr-1 flex-grow-0 flex-shrink-0">
  <div
    class="sheets-navigation-button cursor-pointer"
    class:inactive={!canScrollLeft}
    on:click={() => handleNavigation("left")}
  >
    <Icon
      icon="status-bar-arrow-left"
      fill={canScrollLeft ? activeIconColor : inactiveIconColor}
      width="9px"
      height="12px"
    />
  </div>

  <div
    class="sheets-navigation-button ml-1.5 cursor-pointer"
    class:inactive={!canScrollRight}
    on:click={() => handleNavigation("right")}
  >
    <Icon
      icon="status-bar-arrow-right"
      fill={canScrollRight ? activeIconColor : inactiveIconColor}
      width="9px"
      height="12px"
    />
  </div>
</div>

<style lang="postcss">
  .inactive {
    @apply pointer-events-none;
  }

  .sheets-navigation-button :global(*) {
    pointer-events: none;
  }
</style>
