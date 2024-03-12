<!-- @component
@packageDocumentation
@module components/ContextMenu
-->
<script lang="ts">
  import type { MenuItemType } from "../menu/constant";
  import Menu from "../menu/Menu.svelte";
  import { onMount, setContext } from "svelte";
  import { CLOSE_ROOT_MENU_CONTEXT_NAME } from "../menu/constant";
  import RootContextMenuWrapper from "./RootContextMenuWrapper.svelte";
  import type { ContextMenuPosition } from "./type";

  /**
   * Specify alignment of accordion item chevron icon
   * @type { MenuItemType[] }
   */
  export let data: MenuItemType[];

  /**
   * Specify alignment of accordion item chevron icon
   * @type { HTMLElement }
   */
  export let triggerElement: HTMLElement;
  /**
   * Specify alignment of accordion item chevron icon
   * @type { () => void }
   */
  export let removeContextMenu: () => void;
  /**
   * Specify alignment of accordion item chevron icon
   * @type { string }
   */
  export let menuClass = "";
  /**
   * Specify alignment of accordion item chevron icon
   * @type { ContextMenuPosition }
   */
  export let preferPosition: ContextMenuPosition;
  /**
   * Specify alignment of accordion item chevron icon
   * @type { boolean }
   */
  export let isAtMousePosition = false;
  /**
   * Specify alignment of accordion item chevron icon
   * @type { number }
   */
  export let mouseX: number;
  /**
   * Specify alignment of accordion item chevron icon
   * @type { number }
   */
  export let mouseY: number;

  let menuElement: HTMLElement;

  function handleMousedownOutside(event: Event) {
    const shouldRemoveContextMenu =
      menuElement &&
      !menuElement.contains(event.target as HTMLElement) &&
      ((triggerElement &&
        !triggerElement.contains(event.target as HTMLElement)) ||
        isAtMousePosition); // always close context menu on mouse down if its' position is at the mouse down position

    if (shouldRemoveContextMenu) {
      removeContextMenu();
    }
  }

  onMount(() => {
    document.addEventListener("mousedown", handleMousedownOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleMousedownOutside, true);
    };
  });

  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, removeContextMenu);
</script>

<div class="{menuClass} fixed z-999999" bind:this={menuElement}>
  {#if data?.length}
    <RootContextMenuWrapper
      show={true}
      position="top-bottom"
      {preferPosition}
      distanceToDropdown={4}
      distanceToEdge={1}
      {triggerElement}
      {isAtMousePosition}
      {mouseX}
      {mouseY}
    >
      <Menu {data} isContextMenu isRoot />
    </RootContextMenuWrapper>
  {/if}
</div>
