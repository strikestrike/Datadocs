<script lang="ts">
  import { setContext, getContext } from "svelte";
  import type { MenuItemType } from "../../../../common/menu";
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_STATE_ENABLED,
    CLOSE_ROOT_MENU_CONTEXT_NAME,
    Menu,
  } from "../../../../common/menu";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import { handleUndoRedoMutlipleActions } from "../../../../../app/store/store-toolbar";
  import { HISTORY_ACTION_TYPE_UNDO } from "../../../../panels/History/types/constants";
  import { activeHistoryManager } from "../../../../../app/store/panels/writables";
  import type HistoryAction from "../../../../panels/History/types/history/actions/history-action";

  export let type: string = HISTORY_ACTION_TYPE_UNDO;

  let undoActions: HistoryAction[] = [];
  let redoActions: HistoryAction[] = [];

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);

  function getMergeDropdownItems(): MenuItemType[] {
    let menuItems: MenuItemType[] = [];
    let actions = type === HISTORY_ACTION_TYPE_UNDO ? undoActions : redoActions;
    for (let idx = actions.length - 1; idx >= 0; idx--) {
      menuItems.push({
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: actions[idx].displayName,
        state: MENU_DATA_ITEM_STATE_ENABLED,
        action: () => {
          handleUndoRedoMutlipleActions(type, actions[idx].id);
          closeDropdown();
        },
      });
    }
    if (menuItems.length === 0) {
      menuItems.push({
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: "No actions yet...",
        state: "disabled",
        action: () => {},
      });
    }
    return menuItems;
  }

  $: historyManager = $activeHistoryManager;
  $: historyManager,
    (() => {
      if (!historyManager) {
        return;
      }
      undoActions = historyManager.undoStack.filter((a) => !a.hidden);
      redoActions = historyManager.redoStack.filter((a) => !a.hidden);
    })();
  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, closeDropdown);
</script>

<div class="dropdown">
  <Menu
    data={getMergeDropdownItems()}
    menuClass="min-w-[220px]"
    isRoot
    isContextMenu={false}
  />
</div>

<style lang="postcss">
  .dropdown :global(.menu-element:not(.disabled) svg) {
    @apply text-dark-100;
  }
</style>
