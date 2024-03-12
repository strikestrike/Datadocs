<script lang="ts">
  import { getContext } from "svelte";
  import {
    CLOSE_MODAL_CONTEXT_NAME,
    ModalContentWrapper,
  } from "../../../../common/modal";
  import {
    object as yobject,
    string as ystring,
    boolean as yboolean,
  } from "yup";
  import { createForm } from "felte";
  import { validator } from "@felte/validator-yup";
  import FormInput from "../../../../common/form/FormInput.svelte";
  import Switch from "../../../../common/form/Switch.svelte";
  import Button from "../../../../common/form/Button.svelte";
  import { addMacroHistory } from "../../../../../app/store/panels/store-history-panel";

  const closeModal: Function = getContext(CLOSE_MODAL_CONTEXT_NAME);
  let nameErrorMessage = "";

  function updateErrorMessage() {
    const errs = $errors;
    const getError = (er: any[]) => (er ? er[0] : "");

    nameErrorMessage = getError(errs.name);
  }

  const schema = yobject({
    name: ystring().required("Please enter macro name"),
    reference: yboolean(),
  });

  const { form, errors, setData } = createForm({
    extend: validator({ schema }),
    onSubmit: (values) => {
      addMacroHistory(values);
      closeModal();
    },
  });

  $: $errors, updateErrorMessage();
</script>

<div class="macro-modal-container">
  <ModalContentWrapper title="Add A Macro" isMovable={false}>
    <div class="add-macro-modal">
      <form use:form method="POST">
        <!-- name -->
        <div class="flex flex-row gap-4 mt-7">
          <div class="input-field flex-grow flex-shrink">
            <p class="required">Name</p>
            <div class="input-container input-only">
              <FormInput
                name="name"
                class="focusable"
                errorIndicatorIconSize="20px"
                errorMessage={nameErrorMessage}
                type="text"
                spellcheck="false"
                placeholder="Enter macro name"
                autocomplete="off"
              />
            </div>
          </div>
        </div>

        <!-- reference -->
        <div class="flex flex-row gap-4 mt-7">
          <div
            class="input-field flex flex-row flex-grow justify-evenly flex-shrink"
          >
            <p class="required">Absolute Reference</p>
            <Switch name="reference" on={false} />
            <p class="required">Relative Reference</p>
          </div>
        </div>

        <!-- control button -->
        <div class="mt-10 flex flex-row justify-between">
          <div class="flex flex-row gap-2.5">
            <Button
              type="button"
              color="secondary"
              class="focusable px-5"
              on:click={() => closeModal()}>Cancel</Button
            >
            <Button type="submit" color="primary" class="focusable px-5"
              >Save</Button
            >
          </div>
        </div>
      </form>
    </div>
  </ModalContentWrapper>
</div>

<style lang="postcss">
  .add-macro-modal {
    padding: 20px 50px 40px;
  }

  .macro-modal-container :global(.modal-header) {
    padding-left: 50px !important;
    padding-right: 50px !important;
  }
</style>
