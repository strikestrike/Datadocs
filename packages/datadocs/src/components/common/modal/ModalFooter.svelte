<script lang="ts" context="module">
  export type ModalFooterButton = {
    text: string;
    loading: boolean;
    enabled: boolean;
  };
</script>

<script lang="ts">
  import { createEventDispatcher, getContext } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  import Button from "../form/Button.svelte";
  import { CLOSE_MODAL_CONTEXT_NAME } from "./type";

  //#region Component Properties
  interface $$Props extends HTMLAttributes<HTMLDivElement> {
    status?: string | Error;
    statusClassname?: string;
    buttonCancel?: Partial<ModalFooterButton>;
    buttonConfirm?: Partial<ModalFooterButton>;
  }

  export let status: string | Error = "";
  export let statusClassname: string = "";
  export let buttonCancel: Partial<ModalFooterButton> = { text: "Cancel" };
  export let buttonConfirm: Partial<ModalFooterButton> = { text: "Confirm" };
  //#endregion Component Properties

  //#region Component Events
  const dispatch = createEventDispatcher<{
    close: {};
    confirm: {};
  }>();
  //#endregion Component Events
</script>

<div class="modal-footer flex flex-row justify-between" {...$$restProps}>
  {#if status}
    <div class={statusClassname}>{status}</div>
  {:else}
    <div />
  {/if}

  <div class="flex flex-row gap-2.5">
    {#if buttonCancel.enabled !== false}
      <Button
        disabled={!!buttonCancel.loading}
        type="button"
        color="secondary"
        class="focusable px-5"
        on:click={dispatch.bind(dispatch, "close")}
        >{buttonCancel.text || ""}</Button
      >
    {/if}
    {#if buttonConfirm.enabled !== false}
      <Button
        disabled={!!buttonConfirm.loading}
        type="button"
        color="primary"
        class="focusable px-5"
        on:click={dispatch.bind(dispatch, "confirm")}
        >{buttonConfirm.text || ""}</Button
      >
    {/if}
  </div>
</div>

<style lang="postcss">
  .modal-footer {
    padding: 10px 30px;
  }
</style>
