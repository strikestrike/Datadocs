<script lang="ts">
  import { getContext, tick } from "svelte";
  import type { Field, Struct } from "@datadocs/canvas-datagrid-ng/lib/types";
  import { DataType } from "@datadocs/canvas-datagrid-ng";
  import FieldIcon from "../../FieldIcon.svelte";
  import { SET_TARGET_CONTEXT_NAME } from "./StructFieldSelector";
  import type { SetStructTargetFunction } from "./types";
  import type {
    KeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../../common/key-control/listKeyControl";
  import { registerElement } from "../../../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../../../common/key-control/scrolling";
  import { CLOSE_ROOT_MENU_CONTEXT_NAME } from "../../../../../common/menu";

  const closeContextMenu = getContext(
    CLOSE_ROOT_MENU_CONTEXT_NAME
  ) as () => any;

  export let namespace: string = "";
  export let value: Field;
  export let level: number;

  export let keyControlActionOptions: KeyControlActionOptions;
  export let scrollContainer: HTMLElement = null;
  export let getIndex: () => number;

  const children: Field[] = loadSubvalues();
  const isStruct =
    typeof value.type === "object" && value.type.typeId === DataType.Struct;
  const thisNamespace = (namespace ? namespace + "." : "") + value.name;

  const setTarget = getContext(
    SET_TARGET_CONTEXT_NAME
  ) as SetStructTargetFunction;

  const index = getIndex();

  let element: HTMLElement;
  let selected = false;

  function loadSubvalues() {
    const { type } = value;
    if (typeof type !== "object" || type.typeId !== DataType.Struct) {
      return;
    }
    return (type as Struct).children;
  }

  function setAsTarget() {
    setTarget(thisNamespace);
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
    disabled: isStruct,
  };
</script>

<div
  class="field-container"
  class:target={!isStruct}
  use:registerElement={options}
>
  {#each { length: level } as _}
    <div class="level" />
  {/each}

  <button class="set-button" on:click={setAsTarget} class:selected>
    <span class="title">{value.displayname}</span>
    {#if !isStruct}
      <FieldIcon columnType={value.type} />
    {/if}
  </button>
</div>

{#if children}
  {#each children as child}
    <svelte:self
      level={level + 1}
      value={child}
      namespace={thisNamespace}
      {keyControlActionOptions}
      {scrollContainer}
      {getIndex}
    />
  {/each}
{/if}

<style lang="postcss">
  .field-container {
    @apply flex flex-row items-center;
    justify-content: space-between;

    .field-container:not(.target) .set-button:hover,
    .selected {
      @apply bg-light-50 cursor-pointer;
    }
  }

  .field-container:not(.target) .set-button {
    @apply pointer-events-none;
  }

  .set-button {
    @apply flex flex-row flex-grow bg-transparent border-none space-between rounded m-0 pl-2.5 pr-2 py-1.5 items-center;
  }

  .set-button > .title {
    @apply text-[11px] font-medium text-dark-200 whitespace-nowrap overflow-hidden overflow-ellipsis mr-auto;
    line-height: 16px;
  }

  .level {
    @apply border-r border-light-100 ml-2 mr-0.5 w-[1px] max-w-[1px] self-stretch flex-shrink-0;
  }
</style>
