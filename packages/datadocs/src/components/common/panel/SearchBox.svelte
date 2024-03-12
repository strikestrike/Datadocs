<script lang="ts">
  import Icon from "../icons/Icon.svelte";
  import { createEventDispatcher } from "svelte";
  import backIcon from "./back.svg?raw";

  /**
   * It will be called when users trigger search by pressing enter.
   *
   * NOTE: You can also listen to `search` event instead of providing
   * this `onSearch` callback.
   * @param value Seach text
   */
  export let onSearch = (value: string) => {};
  /**
   * Expose the `searchText` in case we want to search automatically
   * without waiting for user press `enter` key.
   */
  export let searchText = "";
  /**
   * Whether to show clear button or not
   */
  export let showClearButton = true;

  const dispatch = createEventDispatcher();
  let active = false;
  let inputElement: HTMLInputElement;

  function onInputFocus() {
    active = true;
  }

  function onInputBlur() {
    active = false;
  }

  function search(value: string) {
    if (typeof onSearch === "function") {
      onSearch(value);
    }
    dispatch("search", { value });
  }

  function onInputKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      search(searchText);
    }
  }

  function cancelSearch() {
    clearSeachText();
    search(searchText);
    inputElement.focus();
  }

  function clearSeachText() {
    searchText = "";
    inputElement.focus();
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="search-box relative w-full h-8 text-dark-300" class:active>
  <input
    bind:this={inputElement}
    bind:value={searchText}
    class="w-full h-full pl-8 py-1.5 rounded-[3px] text-13px bg-light-50 outline-none border-none caret-primary-indigo-blue"
    class:pr-4={!showClearButton}
    class:pr-8={showClearButton}
    placeholder="Search ..."
    type="text"
    on:focus={onInputFocus}
    on:blur={onInputBlur}
    on:keydown={onInputKeydown}
  />

  <!-- Search icon button -->
  <div
    class="absolute flex flex-row items-center top-0 bottom-0 left-2 pointer-events-none {active
      ? 'text-primary-indigo-blue'
      : 'text-dark-50'}"
  >
    {#if searchText}
      <div
        class="w-5 h-5 flex flex-row items-center justify-center cursor-pointer pointer-events-auto"
        on:click={cancelSearch}
        on:mousedown|preventDefault
      >
        {@html backIcon}
      </div>
    {:else}
      <div class="w-5 h-5">
        <Icon icon="panel-search" size="20px" />
      </div>
    {/if}
  </div>

  {#if showClearButton && active && searchText}
    <div
      class="absolute flex flex-row items-center top-0 bottom-0 right-2 cursor-pointer"
      on:mousedown|preventDefault={() => {}}
      on:click|preventDefault={clearSeachText}
    >
      <Icon icon="panel-search-clear" size="20px" />
    </div>
  {/if}
</div>

<style lang="postcss">
  input::placeholder {
    @apply text-dark-50;
  }

  .search-box.active::after {
    @apply absolute top-0 bottom-0 left-0 right-0 pointer-events-none;
    @apply rounded border border-solid border-primary-indigo-blue;
    box-shadow: 1px 2px 6px 0px rgba(55, 84, 170, 0.16);
    content: "";
  }
</style>
