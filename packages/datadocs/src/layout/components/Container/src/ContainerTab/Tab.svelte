<script lang="ts">
  import clsx from "clsx";
  import { Drag } from "src/layout/components/DragDrop";
  import type { Pane } from "src/layout/types/pane";
  import { BorderCorner } from "src/layout/components/Border";
  import { createEventDispatcher, getContext } from "svelte";
  import Object from "src/components/panels/Objects/Object.svelte";
  import type { ObjectType } from "src/layout/types/object";
  import { appDnd } from "src/app/core/global/app-dnd";
  import { DND } from "src/layout/enums/dnd";
  import { useLayoutSheet, useLayoutWorkBook } from "src/layout/store/pane";
  import type { Type } from "src/layout/types/context";
  import { CONTEXT_TYPE } from "src/layout/constants/context";
  import { ContextType } from "src/layout/enums/context";
  import Icon from "src/components/common/icons/Icon.svelte";
  import { themes, DEFAULT_THEME } from "src/styles/themes/themes";
  import { contextMenuAction } from "src/components/common/context-menu";
  import {
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
  } from "src/components/common/menu";
  import { bind, openModal } from "src/components/common/modal";
  import { ContainerTabModal } from "src/layout/components/Container";

  export let pane: Pane = null;

  export let actived: boolean = false;

  export let dragged: boolean = false;

  export let className: string = "";

  export let action: DND = DND.INSERT_OBJECT;

  export let classNameCorner: string = "";

  const type = getContext<Type>(CONTEXT_TYPE);

  const emits = createEventDispatcher();
  const {
    getById,
    isTabsGroup,
    removeById,
    sync,
    findLastParentDeepById,
    isCollaspeGroup,
    setCollapseById,
    isCollapse,
    getParentById,
    setById,
  } = type === ContextType.SHEET ? useLayoutSheet() : useLayoutWorkBook();

  let closeHover = false;

  $: label = pane?.content?.view?.label || "";
  $: icon = pane?.content?.view?.icon || "";
  $: object = {
    type: "",
    label,
    icon,
  } as ObjectType;
  $: parent = getParentById(pane.id);

  function updateDnd(event) {
    appDnd.update((val) => {
      return {
        ...val,
        action,
        data: {
          ...val.data,
          pane: getById(pane.id),
        },
      };
    });
    emits("dragstart", event.detail);
  }

  function onClickRemove() {
    removeById(pane.id);
    sync();
  }

  function onClickCollapse() {
    const parentDeep = findLastParentDeepById(pane.id, (config) =>
      isCollaspeGroup(config),
    );
    if (parentDeep) {
      setCollapseById(parentDeep.id, true);
    }
  }

  function showModal() {
    const modalElement = bind(ContainerTabModal, {
      pane: parent,
    });
    openModal({
      component: modalElement,
      isMovable: false,
      isResizable: false,
      minWidth: 400,
      minHeight: 300,
      preferredWidth: window.innerWidth - 400,
      preferredHeight: window.innerHeight - 150,
    });
  }

  function onCloseTab() {
    removeById(pane.id);
    sync();
  }

  function onCloseTabGroup() {
    const parent = getParentById(pane.id);
    if (parent) {
      removeById(parent.id);
      sync();
    }
  }

  $: tabPane = isTabsGroup(pane) ? pane.children : [pane];

  $: {
  }
</script>

<!-- <div class="flex items-center justify-start tab-container"> -->
{#each tabPane as child, index (child.id)}
  <div
    class="inline-block"
    use:contextMenuAction={{
      menuItems: [
        {
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: "Collapse",
          state: MENU_DATA_ITEM_STATE_ENABLED,
          action: () => {
            onClickCollapse();
          },
        },
        {
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: "Close Tab",
          state: MENU_DATA_ITEM_STATE_ENABLED,
          status: "warning",
          action: () => {
            onCloseTab();
          },
        },
        {
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: "Close Group",
          state: MENU_DATA_ITEM_STATE_ENABLED,
          status: "warning",
          action: () => {
            onCloseTabGroup();
          },
        },
        {
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: "View in Full Screen",
          state: MENU_DATA_ITEM_STATE_ENABLED,
          action: () => {
            showModal();
          },
        },
      ],
      disabled: false,
      isAtMousePosition: false,
      onOpen: () => {
        setById(parent.id, "props.activeId", pane.id);
      },
    }}
  >
    <Drag on:documentEnd on:dragstart={updateDnd}>
      <div
        class={clsx(
          "tab-item h-6 text-[11px] flex items-center rounded-tl rounded-tr relative font-medium",
          actived
            ? "active h-7.5 !text-tabs-active-color font-bold bg-white"
            : "bg-panels-bg",
          dragged ? "opacity-0" : "",
          className,
        )}
      >
        <div
          class="whitespace-nowrap px-3 overflow-hidden flex items-center rounded-tl rounded-tr h-full label flex item-center"
        >
          <div>{child?.content?.view?.label || ""}</div>
          {#if actived}
            <div
              class="ml-2"
              on:click|stopPropagation={onClickRemove}
              on:mousedown|stopPropagation
              on:mouseover={() => {
                closeHover = true;
              }}
              on:mouseout={() => {
                closeHover = false;
              }}
            >
              <Icon
                icon="panel-close"
                stroke={closeHover
                  ? themes[DEFAULT_THEME].toolbarButtonNormalColor
                  : themes[DEFAULT_THEME].tabsNormalColor}
              />
            </div>
          {/if}
        </div>
        <BorderCorner
          className={clsx(
            actived ? "text-white" : "text-panels-bg",
            classNameCorner,
          )}
        />
        <BorderCorner
          position="right"
          className={clsx(
            actived ? "text-white" : "text-panels-bg",
            classNameCorner,
          )}
        />
      </div>
      <svelte:fragment slot="phantom">
        {#if type === ContextType.SHEET}
          <Object {object} />
        {:else}
          <div
            class="tab-item whitespace-nowrap px-3 text-[11px] font-medium overflow-hidden flex items-center rounded h-7 label"
          >
            {child?.content?.view?.label || ""}
          </div>
        {/if}
      </svelte:fragment>
    </Drag>
  </div>
{/each}

<!-- </div> -->

<style lang="postcss">
  .tab-item:not(.active):hover {
    .label {
      background: rgba(80, 88, 93, 0.12);
    }
    :global(.border-corner) {
      color: rgba(80, 88, 93, 0.12);
    }
  }
  .tab-item {
    color: var(--tabs-normal-color);
    box-shadow: 0px 0px 4px rgba(55, 84, 170, 0.161);
  }
</style>
