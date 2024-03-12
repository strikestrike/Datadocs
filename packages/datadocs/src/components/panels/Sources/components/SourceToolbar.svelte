<script lang="ts">
  import { getContext, onMount, tick } from "svelte";
  import Icon from "../../../common/icons/Icon.svelte";
  import Breadcrumb from "../../../common/panel/breadcrumb/Breadcrumb.svelte";
  import type {
    BreadcrumbDropdownItem,
    BreadcrumbItem,
  } from "../../../common/panel/breadcrumb/type";
  import {
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT,
    DATABASE_STATE_MANAGER_CONTEXT,
    FILE_SYSTEM_VIEW_ALL_FILES_ID,
    UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT,
    UPLOADED_FILES_STATE_MANAGER_CONTEXT,
  } from "../constant";
  import type { SourceStateManager } from "../manager/sourceStateManager";
  import type {
    DatabaseItem,
    SourceNodeItem,
  } from "../../../../app/store/panels/sources/type";
  import type { SourcePanelAction } from "../manager/action";
  import {
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
    type MenuItemType,
  } from "../../../common/menu";
  import type { ContextMenuOptionsType } from "../../../common/context-menu";
  import { contextMenuAction } from "../../../common/context-menu";
  import {
    type ModalConfigType,
    closeModal,
    openModal,
    bind,
  } from "../../../common/modal";
  import AddSourceModal from "./add-source-modal/AddSourceModal.svelte";
  import {
    handleUploadFile,
    handleUploadFolder,
  } from "./file/upload-file-folder";
  import { handleOnIngest } from "../../../grids/ingest-files";

  export let rootType: string = null;
  let rootNode: ReturnType<SourceStateManager<SourceNodeItem>["getUIRoot"]> =
    null;

  const databaseManager: SourceStateManager<SourceNodeItem> = getContext(
    DATABASE_STATE_MANAGER_CONTEXT,
  );
  const databaseActions: SourcePanelAction = getContext(
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT,
  );
  const uploadedFilesManager: SourceStateManager<SourceNodeItem> = getContext(
    UPLOADED_FILES_STATE_MANAGER_CONTEXT,
  );
  const uploadedFileActions: SourcePanelAction = getContext(
    UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT,
  );

  let manager: SourceStateManager<SourceNodeItem> = getManager();

  let actions: SourcePanelAction = getActions();

  let home: BreadcrumbItem = getHomeButton();

  let dropdownItem: BreadcrumbItem = null;

  let paths: BreadcrumbItem[] = [];

  let contextMenuOptions: ContextMenuOptionsType = null;

  function updateRootNode() {
    if (databaseManager.getUIRoot()) {
      rootNode = databaseManager.getUIRoot();
      rootType = "database";
    } else if (uploadedFilesManager.getUIRoot()) {
      rootNode = uploadedFilesManager.getUIRoot();
      rootType = "uploaded-files";
    } else {
      rootNode = null;
      rootType = null;
    }
  }

  function getManager() {
    return rootType === "database" ? databaseManager : uploadedFilesManager;
  }

  function getActions() {
    return rootType === "database" ? databaseActions : uploadedFileActions;
  }

  function getHomeButton() {
    return {
      id: "__sources_panel_root_id",
      name: "HOME",
      prefixIcon:
        !rootNode || rootType === "uploaded-files"
          ? null
          : "panel-breadcrumb-back",
      action: async () => {
        actions.deselectAll();
        actions.openNode(null);
      },
    };
  }

  function buildBreadcrumbPaths(): BreadcrumbItem[] {
    let hasHomeBtn = !rootNode || rootType === "uploaded-files";
    manager = getManager();
    actions = getActions();
    const paths: BreadcrumbItem[] = [];
    dropdownItem = null;

    let currentId = manager.getUIRoot()?.id;
    while (currentId) {
      const node = manager.getNodeById(currentId);
      const nodeId = currentId;

      if (hasHomeBtn || node.parent) {
        paths.unshift({
          id: nodeId,
          name: node.id !== FILE_SYSTEM_VIEW_ALL_FILES_ID ? node.name : "",
          action: async () => {
            actions.deselectAll();
            actions.openNode(nodeId);
          },
        });
      } else {
        dropdownItem = {
          id: nodeId,
          name: node.name,
          prefixIcon: manager.getNodeIcon(node.id),
          action: async () => {
            actions.deselectAll();
            actions.openNode(nodeId);
          },
          getDropdownChildren: (): BreadcrumbDropdownItem[] => {
            const childNodes = manager.getOpenableChildNodesById(node.parent);
            let dropdownItems: BreadcrumbDropdownItem[] = [];
            for (const child of childNodes) {
              dropdownItems.push({
                id: child.id,
                name: child.name,
                subtitle:
                  child.type === "databaseroot" &&
                  (child.dataNode as DatabaseItem).source,
                action: async () => {
                  actions.deselectAll();
                  actions.openNode(child.id);
                },
              });
            }
            return dropdownItems;
          },
        };
      }

      currentId = node.parent;
    }

    return paths;
  }

  function updateContextMenuOptions() {
    if (rootType === null || rootNode === null) {
      let contextMenuItems: MenuItemType[] = [
        {
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: "Connect Database",
          state: MENU_DATA_ITEM_STATE_ENABLED,
          prefixIcon: "tw-source-toolbar-connect-database",
          action: () => {
            handleAddNewSource();
          },
        },
        {
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: "Connect Server",
          state: MENU_DATA_ITEM_STATE_ENABLED,
          prefixIcon: "tw-source-toolbar-connect-server",
          action: () => {
            // triggerEdit();
          },
        },
        {
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: "Upload Files",
          state: MENU_DATA_ITEM_STATE_ENABLED,
          prefixIcon: "tw-source-toolbar-upload-files",
          hint: "csv",
          action: () => {
            handleUploadFile(null);
          },
        },
        {
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: "Upload Folders",
          state: MENU_DATA_ITEM_STATE_ENABLED,
          prefixIcon: "panel-add-folder",
          hint: "folder",
          action: () => {
            handleUploadFolder(null);
          },
        },
      ];

      contextMenuOptions = {
        menuItems: contextMenuItems,
        disabled: false,
        useClickEvent: true,
      };
    } else if (rootType === "uploaded-files") {
      let contextMenuItems: MenuItemType[] = [
        {
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: "Upload Files",
          state: MENU_DATA_ITEM_STATE_ENABLED,
          prefixIcon: "tw-source-toolbar-upload-files",
          hint: "csv",
          action: () => {
            handleUploadFile(rootNode ? rootNode.id : null);
          },
        },
        {
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: "Upload Folders",
          state: MENU_DATA_ITEM_STATE_ENABLED,
          prefixIcon: "panel-add-folder",
          hint: "csv",
          action: () => {
            handleUploadFolder(rootNode ? rootNode.id : null);
          },
        },
      ];

      contextMenuOptions = {
        menuItems: contextMenuItems,
        disabled: false,
        useClickEvent: true,
      };
    } else {
      contextMenuOptions = null;
    }
  }

  function updateBreadcrumb() {
    updateRootNode();
    updateContextMenuOptions();
    manager = getManager();
    paths = manager.hasSearch() ? [] : buildBreadcrumbPaths();
    home = getHomeButton();
  }

  onMount(() => {
    updateBreadcrumb();
    databaseManager.addListener("datachange", updateBreadcrumb);
    uploadedFilesManager.addListener("datachange", updateBreadcrumb);
    return () => {
      databaseManager.removeListener("datachange", updateBreadcrumb);
      uploadedFilesManager.removeListener("datachange", updateBreadcrumb);
    };
  });

  async function handleAddFolderButton() {
    if (rootType === "database" || rootType === "remote-files") {
    } else {
      uploadedFilesManager.addNewNodePlaceholder({
        parent: rootNode?.id ?? null,
        name: "New Folder",
        type: "folder",
      });
    }
  }

  async function handleAddFileButton() {
    if (rootType === "uploaded-files" && rootNode.type === "folder") {
      handleUploadFile(rootNode ? rootNode.id : null);
    } else if (
      rootType === "database" &&
      rootNode &&
      rootNode.type === "managedfiles"
    ) {
      handleOnIngest();
    }
  }

  async function handleEditDatabaseButton() {
    // console.log("On Click Button Edit ======================= ");
  }

  async function handleReloadDatabase() {
    actions = getActions();
    if (actions) {
      actions.refreshNode(rootNode ? rootNode.id : null);
    }
  }

  async function handleAddNewSource() {
    const isMovable = false;
    const isResizable = false;
    const modalElement = bind(AddSourceModal);
    const modalConfig: ModalConfigType<any> = {
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
</script>

<div
  class="panel-source-toolbar flex flex-row items-center max-w-full py-0.5 pl-2.5 pr-1"
>
  <div class="flex-grow flex-shrink min-w-0 h-7">
    <Breadcrumb
      {home}
      {dropdownItem}
      {paths}
      separator="panel-breadcrumb-slash-separator"
    />
  </div>

  {#if rootNode && (!rootType || rootType === "uploaded-files")}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="p-1 cursor-pointer rounded hover:bg-primary-datadocs-blue hover:bg-opacity-10"
      on:click={handleAddFolderButton}
    >
      <Icon icon="panel-add-folder" size="20px" />
    </div>
  {/if}
  {#if rootNode && (rootNode.type === "databaseroot" || rootNode.type === "managedfiles")}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="p-1 cursor-pointer rounded hover:bg-primary-datadocs-blue hover:bg-opacity-10"
      on:click={handleReloadDatabase}
    >
      <Icon icon="panel-reload" size="20px" />
    </div>
  {/if}
  {#if rootNode && rootNode.type === "databaseroot"}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="p-1 cursor-pointer rounded hover:bg-primary-datadocs-blue hover:bg-opacity-10"
      on:click={handleEditDatabaseButton}
    >
      <Icon icon="panel-edit-database" size="20px" />
    </div>
  {/if}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  {#if contextMenuOptions}
    <div
      class="p-1 cursor-pointer rounded hover:bg-primary-datadocs-blue hover:bg-opacity-10"
      use:contextMenuAction={contextMenuOptions}
    >
      <Icon icon="plus-sign" size="20px" fill="#5F89FF" />
    </div>
  {:else}
    <div
      class="p-1 cursor-pointer rounded hover:bg-primary-datadocs-blue hover:bg-opacity-10"
      on:click={handleAddFileButton}
    >
      <Icon icon="plus-sign" size="20px" fill="#5F89FF" />
    </div>
  {/if}
</div>

<style>
  .panel-source-toolbar {
    background: #fff;
    box-shadow: 0px 3px 6px -3px rgba(55, 84, 170, 0.16);
  }
</style>
