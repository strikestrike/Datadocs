<script lang="ts">
  import IconButton from "./components/IconButton.svelte";
  import User from "./components/User.svelte";
  import ShareModal from "./components/modals/MenuRight/ShareModal.svelte";
  import ExportModal from "./components/modals/MenuRight/ExportModal.svelte";

  export let isMobile = false;
</script>

<div
  class="flex flex-row h-full items-center justify-end pr-2.5 text-white"
>
  {#if !isMobile}
    <!-- NOTE: There is no Export option in initial product but save it for later use -->
    <!--
      <IconButton
        icon="export"
        name="Export"
        modalComponent={ExportModal}
      />

      <div class="h-full w-1.5" />
    -->

    <IconButton
      icon="share"
      name="Share"
      modalComponent={ShareModal}
    />

    <div class="w-px h-4 mx-2 border-r border-light-100 border-opacity-20 border-solid" />
  {/if}

  <User />
</div>
