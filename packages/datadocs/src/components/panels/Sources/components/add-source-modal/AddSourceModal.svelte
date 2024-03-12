<script lang="ts">
  import { onMount, getContext } from "svelte";
  import { ModalContentWrapper, CLOSE_MODAL_CONTEXT_NAME } from "../../../../common/modal";
  import Connection from "./Connection.svelte";
  import FieldStyle from "./FieldStyle.svelte";
  import FormInput from "../../../../common/form/FormInput.svelte";
  import Button from "../../../../common/form/Button.svelte";
  import Icon from "../../../../common/icons/Icon.svelte";
  import type { ConnectionSource } from "./type";
  import { addDatabaseTree } from "../../../../../app/store/panels/store-sources-panel";
  import {object as yobject, string as ystring, number as ynumber} from "yup";
  import { validator } from "@felte/validator-yup";
  import { createForm } from "felte";

  const closeModal: Function = getContext(CLOSE_MODAL_CONTEXT_NAME);
  let isPasswordVisible = false;
  let hostErrorMessage = "";
  let portErrorMessage = "";
  let usernameErrorMessage = "";
  let passwordErrorMessage = "";
  let connectionSource: ConnectionSource = "MySQL";

  function togglePasswordVisible() {
    isPasswordVisible = !isPasswordVisible;
  }

  function updateErrorMessage() {
    const errs = $errors;
    const getError = (er: any[]) => (er ? er[0] : "");

    hostErrorMessage = getError(errs.host);
    portErrorMessage = getError(errs.port);
    usernameErrorMessage = getError(errs.username);
    passwordErrorMessage = getError(errs.password);
  }

  const schema = yobject({
    host: ystring().required("Please enter your host"),
    port: ynumber().required("Please enter your port"),
    username: ystring().required("Please enter your username"),
    password: ystring().required("Please enter your password"),
  });

  const { form, errors, setData } = createForm({
    extend: validator({ schema }),
    onSubmit: (values) => {
      addDatabaseTree(values);
      closeModal();
    },
  });

  onMount(() => {
    setData("source", connectionSource);
  });

  $: $errors, updateErrorMessage();
  $: connectionSource, setData("source", connectionSource);
</script>

<div class="source-modal-container">
  <ModalContentWrapper title="Add A source" isMovable={false}>
    <div class="add-source-modal">
      <form use:form method="POST">
        <!-- connection type -->
        <div class="select-connection">
          <div class="input-field">
            <p class="required">Connection</p>
            <div class="input-container input-only">
              <Connection bind:connectionSource/>
            </div>
          </div>
        </div>

        <!-- host -->
        <div class="flex flex-row gap-4 mt-7">
          <div class="input-field flex-grow flex-shrink">
            <p class="required">Host</p>
            <div class="input-container input-only">
              <FormInput
                name="host"
                class="focusable"
                errorIndicatorIconSize="20px"
                errorMessage={hostErrorMessage}
                type="text"
                spellcheck="false"
                placeholder="Enter host"
                autocomplete="off"
              />
            </div>
          </div>

          <div class="input-field" style="max-width: 150px;">
            <p class="required">Port</p>
            <div class="input-container input-only">
              <FormInput
                name="port"
                class="focusable"
                errorIndicatorIconSize="20px"
                errorMessage={portErrorMessage}
                type="number"
                spellcheck="false"
                placeholder="Enter port"
                autocomplete="off"
              />
            </div>
          </div>
        </div>

        <!-- user name -->
        <div class="input-field mt-7">
          <p class="required">Username</p>
          <div class="input-container input-only">
            <FormInput
              name="username"
              class="focusable"
              errorIndicatorIconSize="20px"
              errorMessage={usernameErrorMessage}
              type="text"
              spellcheck="false"
              placeholder="Enter your username"
              autocomplete="off"
            />
          </div>
        </div>

        <!-- password -->
        <div class="input-field mt-7">
          <p class="required">Password</p>
          <div class="input-container input-only">
            <FormInput
              name="password"
              class="focusable"
              errorIndicatorIconSize="20px"
              showErrorIndicatorIcon={false}
              errorMessage={passwordErrorMessage}
              type={isPasswordVisible ? "text" : "password"}
              spellcheck="false"
              placeholder="Enter your password"
              autocomplete="off"
            />

            <div class="postfix-icon">
              <button type="button" class="focusable w-5 h-5" on:click={togglePasswordVisible}>
                <Icon width="20px" height="20px" icon={isPasswordVisible ? "password-visible" : "password-invisible"}/>
              </button>
            </div>
          </div>
        </div>

        <!-- control button -->
        <div class="mt-10 flex flex-row justify-between">
          <Button type="button" color="success" class="focusable px-4">Test Connection</Button>

          <div class="flex flex-row gap-2.5">
            <Button type="button" color="secondary" class="focusable px-5" on:click={() => closeModal()}>Cancel</Button>
            <Button type="submit" color="primary" class="focusable px-5">Save</Button>
          </div>
        </div>
      </form>
    </div>
  </ModalContentWrapper>
</div>
<FieldStyle />

<style lang="postcss">
  .add-source-modal {
    padding: 20px 50px 40px;
  }

  .select-connection {
    max-width: 220px;
  }

  .source-modal-container :global(.modal-header) {
    padding-left: 50px!important;
    padding-right: 50px!important;
  }
</style>
