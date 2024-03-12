<script lang="ts">
  import { onMount, tick } from "svelte";
  import Icon from "../../../common/icons/Icon.svelte";
  import {
    databasesSectionManager,
    fileSystemSectionManager,
  } from "../../../../app/store/panels/store-sources-panel";
  import type {
    TreeGroupManager,
    TreeViewNode,
    TreeViewStateManager,
  } from "./tree-view/index";
  import AddSourceModal from "./add-source-modal/AddSourceModal.svelte";
  import type { ModalConfigType } from "../../../common/modal";
  import { bind, openModal, closeModal } from "../../../common/modal";

  const treeGroups = [databasesSectionManager, fileSystemSectionManager];
  let items: TreeViewNode[] = [];
  let activeGroup: TreeGroupManager = null;
  let activeTree: TreeViewStateManager = null;
  const breadcrumbArrow = `
    <svg width="6" height="26" viewBox="0 0 6 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1L5 13L1 25" stroke="#E9EDF0"/>
    </svg>
  `;

  function updateBreadcrumb() {
    activeGroup = treeGroups.find(group => group.isSelected);
    activeTree = activeGroup ? activeGroup.listTreeViewManager.find(tree => tree.isSelected) : null;
    items = activeTree ? activeTree.getPath(activeTree.selectedTreeNode).map(id => activeTree.getNodeById(id)) : [];
  }

  function onBreadcrumbItemSelected(item: TreeViewNode) {
    activeTree.selectComponent(item.id);
    // notify the active group data has change
    activeGroup.listTreeViewManagerStore.update(v => v);
    updateBreadcrumb();
  }

  function onActiveFileChanged() {
    updateBreadcrumb();
  }

  async function handleAddNewSource() {
    const isMovable = false;
    const isResizable = false;
    const modalElement = bind(AddSourceModal);
    const modalConfig: ModalConfigType = {
      component: modalElement,
      isMovable: isMovable,
      isResizable: isResizable,
      minWidth: 375,
      minHeight: 200,
      preferredWidth: Math.min(window.innerWidth - 20, 720),
    };
    closeModal(); // close current modal
    await tick();
    openModal(modalConfig);
  }

  onMount(() => {
    updateBreadcrumb();
    databasesSectionManager.addEventListener("sourcesPanelActiveFileChanged", onActiveFileChanged);
    return () => {
      databasesSectionManager.removeEventListener("sourcesPanelActiveFileChanged", onActiveFileChanged);
    }
  });
</script>

<div class="relative h-6 w-full pr-6 bg-light-50">
  <div class="breadcrumb-container">
    <div class="breadcrumb-item home-icon">
      <div><Icon icon="home" size="12px" /></div>
      <div class="breadcrumb-arrow">{@html breadcrumbArrow}</div>
    </div>

    {#each items as item}
      <div class="breadcrumb-item" on:click={() => onBreadcrumbItemSelected(item)}>
        <div class="breadcrumb-label">{item.name}</div>
        <div class="breadcrumb-arrow">{@html breadcrumbArrow}</div>
      </div>
    {/each}
  </div>

  <div class="absolute top-1.5 right-1.5 w-3 h-3 text-pink-100" on:click={handleAddNewSource}>
    <Icon icon="plus-sign" size="12px" />
  </div>
</div>

<style lang="postcss">
  .breadcrumb-container {
    @apply flex flex-row h-full items-center text-dark-50 overflow-x-hidden;
    font-size: 11px;
  }

  .breadcrumb-item {
    @apply flex flex-row h-full items-center cursor-pointer;
  }

  .breadcrumb-item:not(.home-icon):not(:last-child) {
    @apply flex-shrink;
    min-width: 26px;
  }

  .breadcrumb-label {
    @apply flex-shrink overflow-hidden;
    min-width: 20px;
    text-overflow: ellipsis;
  }

  .breadcrumb-item > div:first-child {
    @apply px-1.5;
  }

  .breadcrumb-item:last-child {
    @apply font-medium text-primary-datadocs-blue;
  }

  .breadcrumb-item:last-child .breadcrumb-arrow {
    @apply hidden;
  }
</style>
