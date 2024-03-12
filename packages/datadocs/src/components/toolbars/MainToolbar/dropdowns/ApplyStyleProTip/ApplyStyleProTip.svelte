<script lang="ts">
  import {
    applyStyleProTipPosition,
    closeStyleProTipMenu,
    setProTipMenuAsShowed,
  } from "./util";
  import Tooltip from "../../../../common/tooltip/Tooltip.svelte";
  import { bindComponent } from "../../../../../utils/bindComponent";
  import ProTipContent from "./Content.svelte";

  const menuComponent = bindComponent(ProTipContent, {
    closeMenuCallback: () => {
      closeStyleProTipMenu();
    },
  });

  $: triggerRect = $applyStyleProTipPosition;
  $: if (triggerRect) {
    setProTipMenuAsShowed();
  }
</script>

{#if triggerRect}
  <Tooltip
    triggerElement={null}
    {triggerRect}
    contentComponent={menuComponent}
    backgroundStyle="padding: 0px; margin: 0px; z-index: 99999999;"
  />
{/if}

<style lang="postcss">
</style>
