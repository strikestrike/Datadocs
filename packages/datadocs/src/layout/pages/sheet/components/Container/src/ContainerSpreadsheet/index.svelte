<script lang="ts">
  import SpreadSheet from "src/components/panels/SpreadSheet/SpreadSheet.svelte";
  import type { Pane } from "src/layout/types/pane";
  import {
    ContainerTabPreview,
    ContainerTabPreviewIndicator,
  } from "src/layout/components/Container";
  import { Drop } from "src/layout/components/DragDrop";
  import {
    ContainerEmbedded,
    ContainerEmbeddedPhantom,
  } from "../ContainerEmbedded";
  import { getContext, onMount } from "svelte";
  import type { Writable } from "svelte/store";
  import { appDnd } from "src/app/core/global/app-dnd";
  import { objectHoverStatus } from "src/layout/store/object";
  import clsx from "clsx";
  import BorderActive from "../../../../../../components/Border/src/BorderActive.svelte";
  import MoveBar from "../../../MoveBar.svelte";
  import { useLayoutSheet } from "src/layout/store/pane";
  import { DND } from "src/layout/enums/dnd";

  export let pane: Pane = null;

  let elementRoot = null;
  let allowDrop = getContext<Writable<boolean>>("allowDrop");

  const { 
    activePaneId, 
    insert,
    getById,
    removeById,
    sync 
  } = useLayoutSheet();

  $: dragPane = $appDnd?.data?.pane;

  $: content = pane.content;
  $: view = content?.view || null;

  function onDrop({ detail }) {
    dragPane.content.view.config.dropEvent = detail;
    insert({
      targetId: pane.id,
      newPane: dragPane,
    });
  }

  function onMouseUp() {
    $activePaneId = pane.id;
  }

  function onKeyDown(e) {
    if (e.key === 'Delete') {
      const pane = getById($activePaneId);
      if (pane) {
        removeById(pane.id);
        sync();
      }
    }
  }

  onMount(() => {
    if (!$activePaneId) {
      $activePaneId = pane.id;
    }
  });

  $: {
  }
</script>

<div
  class={clsx("bg-white overflow-hidden w-full h-full flex flex-col")}
  bind:this={elementRoot}
  on:click={onMouseUp}
  on:keypress|stopPropagation
>
  <SpreadSheet {pane} {view} />
  <BorderActive
    show={$objectHoverStatus && pane.id === $activePaneId}
    color="gray"
  />

  <!-- embedded container -->
  {#if pane.children?.length}
    <ContainerEmbedded {pane} />
  {/if}

  {#if $allowDrop !== false}
    <!-- preview tab area -->
    <ContainerTabPreview {pane} zIndex={121}>
      <ContainerTabPreviewIndicator>
        <div
          class="absolute top-4 w-[90%] z-51 h-[80px] left-[50%] transform -translate-x-1/2"
        />
      </ContainerTabPreviewIndicator>
    </ContainerTabPreview>
    <!-- embedded area -->
    <Drop
      zIndex={120}
      phantom={$appDnd?.action === DND.INSERT_OBJECT ? "slot" : null}
      on:drop={onDrop}
    >
      <div
        class="absolute w-[95%] h-[calc(100%-40px)] top-[40px] left-[50%] transform -translate-x-1/2"
      />
      <ContainerEmbeddedPhantom slot="phantom" pane={dragPane} />
    </Drop>
  {/if}

  <!-- Could drag it by move bar when it in V-Group or H-Group -->
  <MoveBar {pane} />
</div>

<svelte:window on:keydown={onKeyDown} />