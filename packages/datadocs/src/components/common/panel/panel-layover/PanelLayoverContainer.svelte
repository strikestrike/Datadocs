<script lang="ts">
  import { panelLayoverStore, panelModalStore } from "./store";
  import { ModalWrapper } from "../../modal";

  $: panel = $panelLayoverStore;
</script>

{#if panel}
  <div class="panel-layover-container fixed w-0 h-0 z-999999">
    <svelte:component this={panel} />
  </div>
{/if}

<ModalWrapper modalConfigStore={panelModalStore} />
