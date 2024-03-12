<script lang="ts">
  import type { ComponentType } from "svelte";
  import { onDestroy } from "svelte";
  import type { BreadcrumbItem, BreadcrumbSeparator } from "../type";
  import { bindComponent } from "../../../../../utils/bindComponent";
  import BreadcrumbExpandMenu from "./BreadcrumbExpandMenu.svelte";
  import { setPanelLayover } from "../../panel-layover/store";
  import breadcrumbExpandIcon from "./icon_breadcrumb_expand.svg?raw";
  import breadcrumbExpandActiveIcon from "./icon_breadcrumb_expand_active.svg?raw";

  export let home: BreadcrumbItem = null;
  export let dropdownItem: BreadcrumbItem = null;
  export let paths: BreadcrumbItem[] = [];
  export let breadcrumbElement: HTMLElement;
  export let separator: BreadcrumbSeparator;

  let CLOSE_MENU_DELAY = 400;
  let menuComponent: ComponentType;
  let closeMenuTimeout: ReturnType<typeof setTimeout>;

  function openMenu() {
    clearTimeout(closeMenuTimeout);
    menuComponent = bindComponent(BreadcrumbExpandMenu, {
      home,
      dropdownItem,
      paths,
      parentElement: breadcrumbElement,
      separator,
      onMouseOver: () => {
        clearTimeout(closeMenuTimeout);
      },
      onMouseLeave: () => closeMenu(),
    });
    setPanelLayover(menuComponent);
  }

  function closeMenu(immediate?: boolean) {
    if (immediate) {
      setPanelLayover(null);
      menuComponent = null;
      clearTimeout(closeMenuTimeout);
    } else {
      closeMenuTimeout = setTimeout(() => {
        setPanelLayover(null);
        menuComponent = null;
        clearTimeout(closeMenuTimeout);
      }, CLOSE_MENU_DELAY);
    }
  }

  $: if (paths) closeMenu(true);

  onDestroy(() => closeMenu(true));
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class="breadcrumb-expand flex-grow-0 flex-shrink-0 h-full flex flex-row items-center cursor-pointer"
  class:active={!!menuComponent}
  on:mouseover={openMenu}
  on:mouseleave={() => closeMenu()}
>
  <span class="normal-expand">
    {@html breadcrumbExpandIcon}
  </span>
  <span class="active-expand">
    {@html breadcrumbExpandActiveIcon}
  </span>
</div>

<style lang="postcss">
  .breadcrumb-expand:not(.active) .active-expand {
    @apply hidden;
  }

  .breadcrumb-expand.active .normal-expand {
    @apply hidden;
  }
</style>
