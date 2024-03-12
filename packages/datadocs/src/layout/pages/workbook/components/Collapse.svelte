<script lang="ts">
  import type { Pane } from "src/layout/types/pane";
  import { useLayoutWorkBook } from "src/layout/store/pane";
  import Icon from "src/components/common/icons/Icon.svelte";
  import { Orientation } from "src/layout/enums/divider";
  import clsx from "clsx";

  export let pane: Pane;

  const {
    isVGroup,
    isDashboard,
    isTabsGroup,
    sync,
    setCollapseById,
    getParentById,
    findFirstParentDeepById,
    findFirstChildDeepById,
    isHGroup,
    isRoot,
  } = useLayoutWorkBook();

  $: parent = getParentById(pane.id);

  $: canCollapse =
    isCollaspeGroup(pane) &&
    !findFirstParentDeepById(pane.id, (config) => isCollaspeGroup(config));

  $: isCollaspe = pane?.props?.collapse || false;
  $: direction = isVGroup(parent)
    ? Orientation.VERTICAL
    : Orientation.HORIZONTAL;
  $: directionClass =
    direction === Orientation.VERTICAL
      ? isCollaspe
        ? "rotate-270"
        : "rotate-90"
      : isCollaspe
        ? "rotate-180"
        : "";

  function isCollaspeGroup(config: Pane) {
    return (
      (isVGroup(config) || isHGroup(config) || isTabsGroup(config)) &&
      !isRoot(config) &&
      !isRoot(parent) &&
      !findFirstChildDeepById(config.id, (config) => isDashboard(config))
    );
  }

  function onClick() {
    setCollapseById(pane.id, !isCollaspe);
    sync();
  }

  $: {
    // console.log(directionClass);
  }
</script>

{#if canCollapse}
  <div
    class="panel-collapse-icon absolute top-0 right-0 w-3 h-3 p-0.5 bg-white cursor-pointer z-200"
    on:click|stopPropagation={onClick}
    on:keypress
  >
    <Icon
      icon="panel-collapse"
      width="8"
      height="8"
      fill="none"
      class={clsx("transform", directionClass)}
    />
  </div>
{/if}

<style lang="postcss">
  .panel-collapse-icon {
    box-shadow: 0px 0px 10px 0 0 10px rgba(55, 84, 170, 0.2);
    -webkit-box-shadow: 0 0 10px rgba(55, 84, 170, 0.2);
    &:hover {
      box-shadow: 0 0 5px rgba(55, 84, 170, 0.3);
      -webkit-box-shadow: 0 0 5px rgba(55, 84, 170, 0.3);
    }
  }
</style>
