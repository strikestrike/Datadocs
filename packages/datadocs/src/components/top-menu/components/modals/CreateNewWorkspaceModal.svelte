<script lang="ts">
  import { getContext, onDestroy, onMount, tick } from "svelte";
  import { addWorkspace } from "../dropdowns/ViewWorkspace/utils";
  import { getWorkspaceConfig } from "../../../../app/store/store-workspaces";
  import {
    ModalContentWrapper,
    CLOSE_MODAL_CONTEXT_NAME,
  } from "../../../common/modal";
  import type { CloseModalFunctionType } from "../../../common/modal";
  import { createForm } from "felte";
  import {object as yobject, string as ystring} from "yup";
  import { validator } from "@felte/validator-yup";
  import FormInput from "../../../common/form/FormInput.svelte";
  import Button from "../../../common/form/Button.svelte";
  import { checkUniqueName } from "../../../common/form/utils";

  export let isMovable: boolean;

  let workspaceName = "";
  const closeModal: CloseModalFunctionType = getContext(CLOSE_MODAL_CONTEXT_NAME);
  let inputElement: HTMLInputElement;
  let formElement: HTMLElement;
  const isInputFocus = false;
  let forceValidate = false;
  let isError = false;
  let buttonsContainerElement: HTMLElement;

  async function handleAddNewWorkspace() {
    await validate();
    await tick();
    if (isError) return;
    const workspaceConfig = getWorkspaceConfig();
    errorMessage = await addWorkspace(workspaceName, workspaceConfig);
    if (!errorMessage) closeModal();
  }

  function handleCloseModal() {
    closeModal();
  }

  function handleInputKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      handleAddNewWorkspace();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function handleInput() {
    setTouched("workspace", true);
  }

  function handleWindowKeyDown(event: KeyboardEvent) {
    const activeElement = document.activeElement;
    if (
      event.key === "Enter" &&
      (!activeElement || !buttonsContainerElement.contains(activeElement))
    ) {
      handleAddNewWorkspace();
    }
  }

  onMount(async () => {
    window.addEventListener("keydown", handleWindowKeyDown);

    await tick();
    inputElement = formElement.querySelector("input");
    if (inputElement) {
      inputElement.focus();
    }
  });

  onDestroy(() => {
    window.removeEventListener("keydown", handleWindowKeyDown);
  });

  const schema = yobject({
    workspace: ystring()
      .required("Workspace name can not be empty.")
      .max(100, "Workspace name can not be greater than 100 characters.")
  });

  const felteForm = createForm({
    extend: validator({ schema }),
    onSubmit: async () => {},
  });
  const { form, errors, validate, setTouched } = felteForm;

  $: errorMessage = $errors.workspace ? $errors.workspace[0] : "";
  $: isError = !!errorMessage;
</script>

<ModalContentWrapper title="Create New Workspace" {isMovable}>
  <form use:form autocomplete="off" bind:this={formElement}>
    <div class="px-[30px] pt-[22px] pb-5 bg-white">
      <div class="text-[#A7B0B5] text-10px font-semibold mb-1.5 uppercase">
        Create New Workspace
      </div>

      <div class="workspace-input w-full mb-5">
        <FormInput
          bind:value={workspaceName}
          class="focusable"
          name="workspace"
          placeholder="Workspace name"
          {errorMessage}
          type="text"
          spellcheck="false"
          autocomplete="off"
          on:keydown={handleInputKeyDown}
          on:input|once={handleInput}
        />
      </div>
      <div class="h-9 flex flex-row justify-between items-center">
        <div class="mr-1 font-light text-[#A7B0B5] text-10px italic">
          Panels location will be saved in this workspace.
        </div>

        <div
          bind:this={buttonsContainerElement}
          class="buttons_container h-9 flex flex-row text-13px font-medium space-x-2.5"
        >
          <Button
            class="focusable w-[84px]"
            color="secondary"
            type="button"
            on:click={handleCloseModal}>Cancel</Button
          >
          <Button
            class="focusable w-[84px]"
            color="primary"
            type="button"
            on:click={handleAddNewWorkspace}>Save</Button
          >
        </div>
      </div>
    </div>
  </form>
</ModalContentWrapper>

<style lang="postcss">
  .workspace-input {
    @apply mb-10;
  }
</style>
