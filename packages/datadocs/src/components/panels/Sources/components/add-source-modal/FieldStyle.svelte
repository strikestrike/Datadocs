<style lang="postcss">
  :global {
    .add-source-modal .input-field {
      @apply relative;
    }

    .add-source-modal .input-field input {
      @apply bg-white;
      font-size: 11px;
      height: 42px;
      font-weight: 500 !important;
    }

    .add-source-modal .input-field p {
      @apply font-semibold mb-1.5 text-dark-50 uppercase;
      font-size: 10px;
    }

    .add-source-modal .input-field p.required::after {
      @apply text-tertiary-error;
      content: " *";
    }

    .add-source-modal .input-container {
      position: relative;
    }

    .add-source-modal .input-container .prefix-icon {
      @apply absolute left-4 top-0 bottom-0 z-10 flex flex-row items-center text-light-200;
    }

    .add-source-modal .input-container.focus .prefix-icon {
      @apply text-primary-datadocs-blue;
    }

    .add-source-modal .input-container.focus .postfix-icon {
      @apply text-dark-50;
    }

    .add-source-modal .input-container .postfix-icon {
      @apply absolute right-4 top-0 bottom-0 z-10 flex flex-row items-center text-light-200;
    }

    .add-source-modal .input-container button,
    .add-source-modal .input-container button:active,
    .add-source-modal .input-container button:hover,
    .add-source-modal .input-container button:focus {
      background-color: transparent;
      border: none;
    }

    .add-source-modal .input-container input {
      @apply font-semibold text-dark-200;
      padding: 12px 44px 12px 16px !important;
    }

    .add-source-modal .input-container input::placeholder {
      @apply font-normal text-dark-50;
    }

    .add-source-modal .input-container .error-message {
      font-size: 11px;
    }

    /* Chrome, Safari, Edge, Opera */
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* Firefox */
    input[type="number"] {
      -moz-appearance: textfield;
    }
  }
</style>
