<script lang="ts">
  import { getContext } from "svelte";
  import {
    ModalContentWrapper,
    CLOSE_MODAL_CONTEXT_NAME,
  } from "../../../common/modal";
  import type { CloseModalFunctionType } from "../../../common/modal";
  import type { WrappedMergeStrategyModalResult } from "./types";

  import Header from "./Header.svelte";
  import Choice from "./Choice.svelte";

  export let title: string;
  export let subtitle: string;
  export let onResult: (result: WrappedMergeStrategyModalResult) => void;

  const closeModal: CloseModalFunctionType = getContext(CLOSE_MODAL_CONTEXT_NAME);

  function onChange(result: CustomEvent<WrappedMergeStrategyModalResult>) {
    if (onResult) onResult(result.detail);
    closeModal();
  }
</script>

<ModalContentWrapper hasHeader={false} {title} isMovable={false}>
  <div class="pb-5 bg-white">
    <Header {title} {subtitle} />
    <Choice on:change={onChange} />
  </div></ModalContentWrapper
>
