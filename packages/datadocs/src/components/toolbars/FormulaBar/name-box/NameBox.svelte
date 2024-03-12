<script lang="ts">
  import { nameBoxState } from "../../../../app/store/writables";
  import { DropdownWrapper } from "../../../common/dropdown";
  import Icon from "../../../common/icons/Icon.svelte";
  import NamesDropdown from "./NamesDropdown.svelte";
  import tooltipAction from "../../../common/tooltip";
  import type { ComponentDescriptor } from "@datadocs/canvas-datagrid-ng";
  import type {
    KeyControlConfig,
    RegisterElementOptions,
  } from "../../../common/key-control/listKeyControl";
  import { registerElement } from "../../../common/key-control/listKeyControl";
  import {
    getGrid,
    getGridContainingComponent,
  } from "../../../../app/store/grid/base";

  let active = false;

  let inputElement: HTMLInputElement;

  const defaultKeyControlList: KeyControlConfig[] = [];
  const options: RegisterElementOptions = {
    config: {
      isSelected: false,
      index: 0,
      onSelectCallback,
      onDeselectCallback,
    },
    configList: defaultKeyControlList,
    index: 0,
  };

  async function onSelectCallback(byKey = false) {
    if (!byKey) return;
    inputElement.focus();
  }

  function onDeselectCallback(byKey = false) {
    if (!byKey) return;
    inputElement.blur();
  }

  function onItemSelected(item: ComponentDescriptor) {
    const ns = item.controller.getNamespace();
    goToItem((ns ? ns + "." : "") + item.name);
  }

  function goToItem(name: string) {
    try {
      const containingGrid = getGridContainingComponent(name);
      if (containingGrid && containingGrid.goToName(name)) {
        return true;
      }
      return getGrid()?.goToName(name);
    } catch (e) {
      // Consider it handled on error.
      alert("The range is not valid.");
      return true;
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      const name = inputElement.value.trim();
      const grid = getGrid();

      if (!goToItem(name) && grid) {
        try {
          if (grid.nameSelectedRanges(name)) {
            $nameBoxState = grid.getNameBoxState(true);
          } else {
            resetInput();
          }
        } catch (e) {
          alert("Please enter a valid name for the range.");
        }
      }
    }
  }

  function onFocusIn() {
    active = true;
  }

  function onFocusOut() {
    resetInput();
  }

  function mousedown(e: MouseEvent) {
    // If it is the input element, don't grab the focus.
    if (e.target == inputElement) return;
    if (active) {
      // Hide the already visible dropdown menu.
      active = false;
      return;
    }
    inputElement.focus();
    e.preventDefault();
    e.stopPropagation();
  }

  function resetInput() {
    inputElement.value = $nameBoxState.value;
  }
</script>

<DropdownWrapper bind:show={active}>
  <div
    class="flex flex-row items-center gap-1 cursor-pointer"
    style="width: 100px"
    slot="button"
    use:tooltipAction={{
      content: "Name box",
      disabled: active,
    }}
    on:mousedown={mousedown}
  >
    <div class="h-5" style="margin-right: auto">
      <input
        use:registerElement={options}
        bind:this={inputElement}
        value={$nameBoxState.value}
        class="w-full h-full px-0.5 border-none outline-none leading-5 font-medium text-dark-300 text-13px"
        type="text"
        on:focusin={onFocusIn}
        on:focusout={onFocusOut}
        on:keydown={onKeyDown}
      />
    </div>

    <div>
      <Icon
        icon="toolbar-arrow-dropdown"
        width="7px"
        height="4px"
        fill="currentColor"
      />
    </div>
  </div>
  <NamesDropdown {onItemSelected} {defaultKeyControlList} slot="content" />
</DropdownWrapper>

<style lang="postcss">
  input {
    font-family: Roboto;
  }
</style>