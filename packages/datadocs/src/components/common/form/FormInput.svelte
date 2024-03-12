<script lang="ts">
  import Icon from "../../common/icons/Icon.svelte";

  export let value = "";
  export let name = "";
  export let icon = "";
  export let iconAction = undefined;
  export let errorMessage = "";
  export let showErrorIndicatorIcon = true;
  export let showErrorMessage = true;
  export let errorIndicatorIconSize = "15px";
  export let hasActiveStyle = true;
  export let isFocus = false;
  let className = "";
  export { className as class };

  let status: "active" | "error" | "normal" = "normal";

  function handleFocus() {
    isFocus = true;
  }

  function handleBlur() {
    isFocus = false;
  }

  $: if (errorMessage || isFocus) {
    if (errorMessage) {
      status = "error";
    } else if (isFocus && !errorMessage && hasActiveStyle) {
      status = "active";
    } else {
      status = "normal";
    }
  } else {
    status = "normal";
  }
</script>

<div
  class="input-container input-{status}"
  class:show-error-indicator-icon={showErrorIndicatorIcon}
>
  <input
    bind:value
    class={className}
    {name}
    {...$$restProps}
    on:focus={handleFocus}
    on:blur={handleBlur}
    on:focus
    on:blur
    on:keydown
    on:input
  />

  {#if icon}
    <div class="postfix-icon">
      {#if iconAction}
        <button
          type="button"
          class="focusable w-5 h-5 border-transparent bg-transparent"
          on:click={iconAction}
        >
          <span class="icon-wrapper">
            <Icon
              width="20px"
              height="20px"
              icon={icon}
            />
          </span>
        </button>
      {:else}
        <span class="icon-wrapper">
          <Icon
            width="20px"
            height="20px"
            icon={icon}
          />
        </span>
      {/if}
    </div>
  {/if}

  <div class="error-indicator">
    <Icon icon="input-form-error" size={errorIndicatorIconSize} />
  </div>

  <div class="error-border" />

  <div class="error-message" class:hidden={!showErrorMessage}>
    <span class="message">{errorMessage ?? ""}</span>
  </div>
</div>

<style lang="postcss">
  .input-container {
    @apply rounded relative bg-white z-0;

    .postfix-icon {
      position: absolute;
      right: 1rem;
      top: 0px;
      bottom: 0px;
      z-index: 10;
      display: flex;
      flex-direction: row;
      align-items: center;
      --tw-text-opacity: 1;
      color: rgba(211, 219, 224, var(--tw-text-opacity));

      .icon-wrapper {
        position: relative;
        left: -100%;
        top: -100%;
      }
    }
  }

  input {
    @apply rounded m-0 w-full;
    border: 1px solid #e9edf0;
    box-sizing: border-box;
    outline: none;
    padding-right: 40px;
  }

  .input-active input {
    border-color: #3bc7ff;
    background-color: rgba(59, 199, 255, 0.06);
  }

  .error-indicator {
    @apply flex flex-row items-center absolute top-0 bottom-0 right-4 opacity-0;
  }

  .input-error .error-indicator {
    opacity: 1;
  }

  .input-container:not(.show-error-indicator-icon) .error-indicator {
    display: none;
  }

  .input-error .error-border {
    @apply absolute left-0 right-0 top-0 -bottom-px rounded pointer-events-none;
    border: 2px solid #ea4821;
  }

  .input-error .error-message {
    @apply absolute w-full font-medium text-white rounded-bl rounded-br px-3 pt-2 pb-1;
    background-color: #ea4821;
    top: calc(100% - 4px);
    padding-left: 0;
    padding-right: 0;
    z-index: -1;
    .message {
      margin-left: 2%;
    }
  }

  .input-container input {
    @apply font-medium text-dark-200;
    padding: 10px 48px 10px 14px;
    font-size: 11px;
  }

  .input-container input::placeholder {
    @apply font-normal text-dark-50;
  }

  .input-container .error-message {
    font-size: 10px;
  }
</style>
