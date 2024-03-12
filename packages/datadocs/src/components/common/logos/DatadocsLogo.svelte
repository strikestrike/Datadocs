<script lang="ts">
  import Icon from "../icons/Icon.svelte";

  export let width = "56px";
  export let height = "56px";
  export let isMobileLogo = false;
</script>

<div class="relative h-full flex flex-row items-center">
  <Icon
    icon={isMobileLogo ? "datadocs-mobile-logo" : "datadocs-logo"}
    {width}
    {height}
  />
</div>
