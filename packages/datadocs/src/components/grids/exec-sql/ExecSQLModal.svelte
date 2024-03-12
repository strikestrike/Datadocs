<script lang="ts">
  import { getContext } from "svelte";
  import {
    ModalContentWrapper,
    CLOSE_MODAL_CONTEXT_NAME,
  } from "../../common/modal";
  import ModalFooter from "../../common/modal/ModalFooter.svelte";
  import type { Readable } from "svelte/store";
  import type { StoreValue } from "../../svelte-types";

  const modalTitle = "Execute SQL";
  let closeModal: () => any = getContext(CLOSE_MODAL_CONTEXT_NAME);

  export let sql: string;
  export let result: Readable<{ elapsed?: number; error?: string }>;
  export let resultData: Readable<string>;
  export let executing: Readable<boolean>;

  let r: StoreValue<typeof result>;
  let rData: StoreValue<typeof resultData>;
  $: {
    r = $result;
    rData = $resultData;
  }
</script>

<ModalContentWrapper title={modalTitle} isMovable={false}>
  <pre class="sql-input"><code>{sql}</code></pre>
  <div class="modal-body">
    <div class="modal-row">Executing ...</div>
    {#if r.error}
      <div class="modal-row text-red-500">Error: {r.error}</div>
    {:else if r.elapsed}
      <div class="modal-row text-green-600">Executed: +{r.elapsed}ms</div>
    {/if}
    {#if rData}
      <div class="modal-row">Result:</div>
    {/if}
    {#if rData}
      <pre class="sql-output"><code>{rData}</code></pre>
    {/if}
  </div>
  <ModalFooter
    on:close={closeModal}
    on:confirm={closeModal}
    buttonConfirm={{ text: "Close", loading: $executing }}
    buttonCancel={{ enabled: false }}
  />
</ModalContentWrapper>

<style lang="postcss">
  .sql-input {
    @apply bg-stone-100 rounded-md;
    padding: 5px 15px;
    margin: 10px 15px;
  }
  .sql-output {
    @apply bg-stone-100 rounded-md;
    padding: 5px 15px;
    margin: 5px 15px;
  }
  .modal-row {
    padding: 0 30px;
  }
  .modal-body {
    max-height: 200px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
</style>
