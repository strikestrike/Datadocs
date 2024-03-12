<script lang="ts">
  import { getContext, tick } from "svelte";
  import type { GridJsonTypeMap } from "@datadocs/canvas-datagrid-ng/lib/types";
  import type {
    KeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../../common/key-control/listKeyControl";
  import { registerElement } from "../../../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../../../common/key-control/scrolling";
  import { CLOSE_ROOT_MENU_CONTEXT_NAME } from "../../../../../common/menu";
  import { SET_PATH_CONTEXT_NAME } from "./JsonPathSelector";
  import type { SetJsonPathFunction } from "./types";

  const closeContextMenu = getContext(
    CLOSE_ROOT_MENU_CONTEXT_NAME
  ) as () => any;
  const setTarget = getContext(SET_PATH_CONTEXT_NAME) as SetJsonPathFunction;

  export let namespace: string = undefined;
  export let key: string;
  export let children: GridJsonTypeMap | undefined;
  export let level: number;

  export let path: string;

  export let keyControlActionOptions: KeyControlActionOptions;
  export let scrollContainer: HTMLElement = null;
  export let getIndex: () => number;

  const thisNamespace = (namespace ? namespace + "." : "") + key;
  const isNone = !thisNamespace;

  const index = getIndex();

  let element: HTMLElement;
  let selected = false;

  function setAsTarget() {
    setTarget(thisNamespace || undefined);
    closeContextMenu?.();
  }

  function onEnterKeyCallback(event: KeyboardEvent) {
    if (event.key === "Enter" && selected) {
      setAsTarget();
    }
  }

  async function onSelectCallback(byKey = true) {
    selected = true;
    if (!byKey) return;
    await tick();
    scrollVerticalToVisible(scrollContainer, element);
  }

  function onDeselectCallback() {
    selected = false;
  }

  function entries() {
    return Object.entries(children).sort(([a], [b]) => {
      return a.localeCompare(b);
    });
  }

  const options: RegisterElementOptions = {
    config: {
      isSelected: selected,
      index,
      onSelectCallback,
      onDeselectCallback,
      onEnterKeyCallback,
    },
    configList: keyControlActionOptions.configList,
    index,
  };
</script>

<div class="path-container" use:registerElement={options}>
  {#each { length: level } as _}
    <div class="level" />
  {/each}

  <button
    class="set-button"
    on:click={setAsTarget}
    class:selected
    class:active={(thisNamespace || undefined) == path}
  >
    <span class="title" class:none={isNone}>{isNone ? "Root" : key}</span>
  </button>
</div>

{#if children}
  {#each entries() as [childKey, grandchildren]}
    <svelte:self
      level={level + 1}
      key={childKey}
      children={grandchildren}
      namespace={thisNamespace}
      {path}
      {keyControlActionOptions}
      {scrollContainer}
      {getIndex}
    />
  {/each}
{/if}

<style lang="postcss">
  .path-container {
    @apply flex flex-row items-center;
    justify-content: space-between;

    .path-container .set-button:hover,
    .selected {
      @apply bg-light-50 cursor-pointer;
    }
  }

  .set-button {
    @apply flex flex-row flex-grow bg-transparent border-none space-between rounded m-0 pl-2.5 pr-2 py-1.5 items-center;
  }

  .set-button.active > .title {
    @apply text-primary-datadocs-blue;
  }

  .set-button > .title {
    @apply text-[11px] font-medium text-dark-200 whitespace-nowrap overflow-hidden overflow-ellipsis mr-auto;
    line-height: 16px;
  }

  .level {
    @apply border-r border-light-100 ml-2 mr-0.5 w-[1px] max-w-[1px] self-stretch flex-shrink-0;
  }
</style>
