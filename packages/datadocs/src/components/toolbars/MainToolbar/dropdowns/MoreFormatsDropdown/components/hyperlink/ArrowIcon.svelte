<script lang="ts">
  import Icon from "../../../../../../common/icons/Icon.svelte";

  export let active: boolean;
</script>

<div class={active ? "text-dark-200" : "text-dark-50"}>
  <Icon
    icon="toolbar-arrow-dropdown"
    width="7px"
    height="4px"
    fill="currentColor"
  />
</div>
