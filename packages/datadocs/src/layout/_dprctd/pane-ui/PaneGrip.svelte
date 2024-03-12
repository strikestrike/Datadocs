<!-- @component
@packageModule(layout/FlexPaneGrip)
-->
<script lang="ts">
  import clsx from "clsx";
  import { getContext } from "svelte";
  import type { GlobalContext } from "../types";
  import { GLOBAL_CONTEXT } from "../core/constants";
  import Icon from "src/components/common/icons/Icon.svelte";

  let className = "";
  export { className as class };

  export let opened = false;
  export let orientation = "vertical";

  export let dragHandlers = null;

  export let dragSource = null;

  export let data = {};

  const globalContext: GlobalContext = getContext(GLOBAL_CONTEXT);
</script>

<div
  class={clsx(
    "pane-grip",
    !opened && "closed",
    orientation === "horizontal" && "horizontal",
    orientation === "vertical" && "vertical",
    className
  )}
  use:dragHandlers
  {...data}
>
  {#if opened === true}
    <div class="grip">
      <Icon icon="h-grip-tiny" width="26px" height="2px" />
    </div>
  {:else if orientation === "horizontal"}
    <div class="flex flex-col justify-center mx-[6px]">
      <Icon
        icon="collapsed-panel-horizontal-left"
        width="6px"
        height="26px"
        fill="#A7B0B5"
      />
    </div>
  {:else}
    <div class="flex flex-row justify-center my-[6px]">
      <Icon
        icon="collapsed-panel-vertical-top"
        width="26px"
        height="6px"
        fill="#A7B0B5"
      />
    </div>
  {/if}
</div>

<style lang="postcss">
  .pane-grip {
    @apply w-full flex flex-row justify-center items-center;
    background: #a7b0b5d0;
  }

  .pane-grip.closed {
    background: none;
  }

  .pane-grip.vertical {
    width: 100%;
    height: 6px;
  }

  .pane-grip.vertical.closed {
    height: 12px;
  }

  .pane-grip.horizontal {
    width: 6px;
    height: 100%;
  }

  .pane-grip.horizontal.closed {
    width: 12px;
  }

  .pane-grip :global(*) {
    @apply pointer-events-none;
  }
</style>
