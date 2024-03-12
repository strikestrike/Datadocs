<script lang="ts">
  import { childToolbarValue } from "../../../app/store/writables";
  import ChildToolbarButton from "./buttons/ChildToolbarButton.svelte";
  import HomeToolbar from "./children/HomeToolbar.svelte";
  import ImageToolbar from "./children/ImageToolbar.svelte";
  import { ApplyStyleProTip } from "./dropdowns/ApplyStyleProTip";

  $: childToolbar = $childToolbarValue;
</script>

<div class="main-toolbar h-full w-full flex flex-row items-center bg-white">
  <!-- <div class="pr-4 grow-0 shrink-0">
    <ChildToolbarButton />
  </div> -->

  <div class="w-full max-w-full overflow-hidden">
    {#if childToolbar === "image"}
      <ImageToolbar />
    {:else if childToolbar === "home"}
      <HomeToolbar />
    {/if}
  </div>
</div>

<ApplyStyleProTip />

<style lang="postcss">
  .main-toolbar {
    border-radius: 3px 3px 0px 0px;
    padding: 5px 16px 5px 77px;
  }
</style>
