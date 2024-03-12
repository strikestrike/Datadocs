<script lang="ts">
  import ContainerTab from "../Tabs.svelte";
  import type { Pane } from "src/layout/types/pane";
  import { setContext } from "svelte";
  import { useLayoutSheet } from "src/layout/store/pane";
  import { appDnd } from "src/app/core/global/app-dnd";
  import { useTab } from "../useTab";

  export let pane: Pane;
  export let zIndex = 0;

  let previewPane;
  let tabInstance: any = null;
  let isDragOver = false;

  $: dragPane = $appDnd?.data?.pane;
  $: isDND = !!$appDnd;
  $: parent = getParentById(pane.id);
  $: parentIsTabsGroup = isTabsGroup(parent);

  const { getById, getParentById, isTabsGroup, sync } = useLayoutSheet();

  const { addTab, createTabFromPane } = useTab();

  function onMouseEnter() {
    if (isTabsGroup(parent)) {
      return;
    }
    previewPane = createTabFromPane({
      targetPane: getById(pane.id),
      pane: { ...dragPane },
    });
    appDnd.update((val) => {
      return {
        ...val,
        data: {
          ...val.data,
          pane: dragPane,
        },
      };
    });
  }

  function onMouseLeave() {
    previewPane = null;
    isDragOver = false;
  }

  function onMouseMove(event: MouseEvent) {
    console.log(tabInstance);
    isDragOver = true;
    tabInstance?.onDragOver({ detail: event });
  }

  function onDrop() {
    const children = tabInstance?.getChildren() || previewPane?.children || [];
    const index = children.findIndex((child) => child.id === dragPane.id);
    if (isTabsGroup(dragPane)) {
      const [firstPane, ...restPane] = dragPane?.children || [];
      const tabPane = addTab({
        targetId: pane.id,
        pane: firstPane,
        index: index,
      });
      sync();
      restPane?.forEach((child, i) => {
        const rs = addTab({
          targetId: tabPane.id,
          pane: child,
          index: index + i + 1,
        });
      });
    } else {
      addTab({
        targetId: pane.id,
        pane: dragPane,
        index,
      });
    }
  }

  setContext("onDragIn", onMouseEnter);
  setContext("onDragOut", onMouseLeave);
  setContext("onDragOver", onMouseMove);
  setContext("onDrop", onDrop);

  $: {
    // console.log(pane);
  }
</script>

{#if isDND && !parentIsTabsGroup}
  <div
    class="absolute top-0 left-0 w-full h-full pointer-events-none"
    style:z-index={zIndex}
  >
    <div class="pointer-events-auto">
      <slot
        onDragIn={onMouseEnter}
        onDragOut={onMouseLeave}
        onDragOver={onMouseMove}
        {onDrop}
      />
    </div>
    {#if previewPane && isDragOver}
      <div class="absolute w-full h-full top-0 left-0 z-1">
        <ContainerTab
          bind:this={tabInstance}
          pane={previewPane}
          isShowContent={false}
        />
      </div>
    {/if}
  </div>
{/if}
