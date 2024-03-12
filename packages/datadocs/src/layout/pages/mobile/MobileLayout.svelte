<!-- @component
@packageModule(layout/MobileLayout)
-->
<script lang="ts">
  import DefaultPanel from "../default-panels/DefaultPanel.svelte";
  import MobileBottomBar from "./MobileBottomBar.svelte";

  // import { GLOBAL_CONTEXT } from "../../core/constants";
  import type { Pane } from "src/layout/types/pane";
  import { setContext } from "svelte";

  export let children: Pane[] = [];

  /**
   * Panel Component
   */
  export let PanelComponent: any = DefaultPanel;

  export let Icon: any;

  // const globalContext: GlobalContext = {
  //   Icon,
  // };

  // setContext(GLOBAL_CONTEXT, globalContext);

  // Not is use now
  // const panesContext = {
  //   toggleCollapsedQueryToolbar(isCollapsed: boolean) {
  //     if (!datagridPane) {
  //       return;
  //     }

  //     const view = datagridPane.settingx.view;
  //     view.queryToolbar = view.queryToolbar || {};

  //     view.queryToolbar.collapse = isCollapsed;
  //     children = children;
  //     saveWorkspace();
  //   },
  //   resizeQueryToolbar(height: number, layoutChange: boolean) {
  //     const view = datagridPane.settingx.view;
  //     view.queryToolbar = view.queryToolbar || {};
  //     view.queryToolbar.height = height;
  //     children = children;

  //     if (layoutChange) {
  //       saveWorkspace();
  //     }
  //   },
  // };

  // Not is use now
  // function saveWorkspace() {
  //   let ws = {
  //     ...getMobileWorkspace(),
  //     data: JSON.stringify(mobileWorkspace),
  //   };

  //   saveMobileWorkspace(ws);
  // }

  // $: datagridPane = children[0];
</script>

<div class="mobile-layout">
  {#each children as child (child.id)}
    {#if child.content?.view}
      <div class="sheet-container">
        <svelte:component this={PanelComponent} pane={child} />
      </div>

      <div class="w-full h-1 flex-shrink-0 flex-grow-0" />
    {:else}
      <div class="pane-container">
        <MobileBottomBar pane={child} {PanelComponent} />
      </div>
    {/if}
  {/each}
</div>

<style lang="postcss">
  .mobile-layout {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sheet-container {
    flex-shrink: 1;
    flex-grow: 1;
  }

  .pane-container {
    height: 40px;
    min-height: 40px;
    max-height: 40px;
    flex-shrink: 0;
    flex-grow: 0;
  }
</style>
