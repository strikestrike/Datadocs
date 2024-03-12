<style lang="postcss">
  :global {
    .firestore-docs-modal {
      padding: 20px 50px 40px;
    }
    .firestore-docs-modal .input-field {
      @apply relative;
    }

    .firestore-docs-modal .input-field input {
      @apply bg-white;
      font-size: 11px;
      height: 42px;
      font-weight: 500 !important;
    }

    .firestore-docs-modal .input-container {
      position: relative;
    }

    .firestore-docs-modal .input-container .prefix-icon {
      @apply absolute left-4 top-0 bottom-0 z-10 flex flex-row items-center text-light-200;
    }

    .firestore-docs-modal .input-container.focus .prefix-icon {
      @apply text-primary-datadocs-blue;
    }

    .firestore-docs-modal .input-container.focus .postfix-icon {
      @apply text-dark-50;
    }

    .firestore-docs-modal .input-container .postfix-icon {
      @apply absolute right-4 top-0 bottom-0 z-10 flex flex-row items-center text-light-200;
    }

    .firestore-docs-modal .input-container button,
    .firestore-docs-modal .input-container button:active,
    .firestore-docs-modal .input-container button:hover,
    .firestore-docs-modal .input-container button:focus {
      background-color: transparent;
      border: none;
    }

    .firestore-docs-modal .input-container input {
      @apply font-semibold text-dark-200;
      padding: 12px 44px 12px 16px !important;
    }

    .firestore-docs-modal .input-container input::placeholder {
      @apply font-normal text-dark-50;
    }

    .firestore-docs-modal .input-container .error-message {
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
