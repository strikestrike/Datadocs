<script lang="ts">
  import { SUBMENU_CHANGE_CONTEXT_NAME, MENU_CLASSNAME } from "./constant";
  import { getContext, onMount } from "svelte";

  const handleParentSubmenuChange: Function = getContext(
    SUBMENU_CHANGE_CONTEXT_NAME
  );

  function onParentSubmenuChange() {
    if (handleParentSubmenuChange) {
      handleParentSubmenuChange();
    }
  }

  onMount(() => {
    onParentSubmenuChange();
    return () => {
      onParentSubmenuChange();
    };
  });
</script>

<div class="{MENU_CLASSNAME} h-[inherit]">
  <slot />
</div>
