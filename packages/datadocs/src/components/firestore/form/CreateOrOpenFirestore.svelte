<script lang="ts">
  import type { createForm } from "felte";
  import FormInput from "../../common/form/FormInput.svelte";
  import Icon from "../../common/icons/Icon.svelte";
  import Button from "../../common/form/Button.svelte";
  import DocumentSelector from "./DocumentSelector.svelte";
  import FieldStyle from "./FormStyle.svelte";
  import type { FormResult } from "./form";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{ close: {} }>();

  type Form = ReturnType<typeof createForm>;
  export let formContext: Form;

  const { form, errors, setData } = formContext;

  const errorStrings: { [x in keyof FormResult]?: string } = {};
  function updateErrorMessage() {
    let errs = $errors;
    const getError = (e: any[]) => e?.[0] || "";
    errorStrings.docId = getError(errs.docId);
    errorStrings.password = getError(errs.password);
  }

  let selectedDocId = "";
  let isPasswordVisible: boolean = false;
  const togglePasswordVisible = () => (isPasswordVisible = !isPasswordVisible);

  $: $errors, updateErrorMessage();
  $: selectedDocId, setData("docId", selectedDocId);
</script>

<div class="firestore-docs-modal">
  <form use:form method="POST">
    <!-- host -->
    <div class="flex flex-row gap-4 mt-7">
      <div class="input-field flex-grow flex-shrink">
        <p class="required">Firestore Document:</p>
        <div
          class="input-container input-only {errorStrings.docId
            ? 'doc-error-border'
            : ''}"
        >
          <DocumentSelector bind:selectedDocId />
        </div>
        {#if errorStrings.docId}
          <div class="doc-error">
            {errorStrings.docId ?? ""}
          </div>
        {/if}
      </div>
    </div>

    <div class="input-field mt-7">
      <p class="required">Password</p>
      <div class="input-container input-only">
        <FormInput
          name="password"
          class="focusable"
          errorIndicatorIconSize="20px"
          showErrorIndicatorIcon={false}
          errorMessage={errorStrings.password}
          type={isPasswordVisible ? "text" : "password"}
          spellcheck="false"
          placeholder="Enter your password"
          autocomplete="off"
          icon={isPasswordVisible
            ? "password-visible"
            : "password-invisible"}
          iconAction={togglePasswordVisible}
        />
      </div>
    </div>
    <!-- control button -->
    <div class="mt-10 flex flex-row justify-end">
      <div class="flex flex-row gap-2.5">
        <Button
          type="button"
          color="secondary"
          class="focusable px-5"
          on:click={() => dispatch("close")}>Cancel</Button
        >
        <Button type="submit" color="primary" class="focusable px-5"
          >Open</Button
        >
      </div>
    </div>
  </form>
</div>
<FieldStyle />

<style lang="postcss">

  .input-container.doc-error-border {
    @apply left-0 right-0 top-0 -bottom-px rounded pointer-events-none;
    border: 2px solid #ea4821;
  }
  .doc-error {
    @apply w-full font-medium text-white rounded-bl rounded-br left-0 right-0 px-3 pt-2 pb-1;
    background-color: #ea4821;
    top: calc(100% - 4px);
    margin-top: -2px;
    z-index: -1;
  }
</style>
