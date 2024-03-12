<script lang="ts">
  import type {
    ColumnType,
    Field,
    GridHeader,
    Struct,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng/lib/types";
  import { DataType } from "@datadocs/canvas-datagrid-ng";
  import { createEventDispatcher, getContext, setContext } from "svelte";
  import type {
    KeyControlActionOptions,
    KeyControlConfig,
  } from "../../../../../common/key-control/listKeyControl";
  import { keyControlAction } from "../../../../../common/key-control/listKeyControl";
  import FieldIcon from "../../FieldIcon.svelte";
  import { SET_TARGET_CONTEXT_NAME } from "./StructFieldSelector";
  import type { SetStructTargetFunction } from "./types";
  import FieldItem from "./FieldItem.svelte";
  import DropdownButton from "../../../../../common/form/button/DropdownButton.svelte";
  import { getHeaderAsField } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";
  import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";

  setContext(SET_TARGET_CONTEXT_NAME, onChoose as SetStructTargetFunction);

  const dispatch = createEventDispatcher<{ updated: { header: GridHeader } }>();

  export let table: TableDescriptor;
  export let header: GridHeader;

  /**
   * The current target that is used for filtering and sorting.
   */
  export let structPath: string;

  export { className as class };
  let className = "";

  let targetResolved = resolveTarget(structPath);
  $: targetResolved = resolveTarget(structPath);

  let dropdown: HTMLElement;

  const children = (header.type as Struct).children;

  async function onChoose(newTarget: string) {
    await ensureAsync(
      table.dataSource.setStructFilterPath(header.id, newTarget)
    );
    structPath = newTarget;
    dispatch("updated", { header: table.dataSource.getHeaderById(header.id) });
  }

  function resolveTarget(target: string | undefined): Field | undefined {
    const names = target?.split(".");
    if (!names?.length || !header.type) return;

    let current = getHeaderAsField(header);
    for (const name of names) {
      const struct_ = downcastToStruct(current?.type);
      if (!struct_) return;
      const { children } = struct_;
      current = undefined;
      for (const child of children) {
        if (child.name === name) {
          current = child;
          break;
        }
      }
    }

    return current;
  }

  function downcastToStruct(type: ColumnType): Struct | undefined {
    if (typeof type !== "object" || type.typeId !== DataType.Struct) return;
    return type as Struct;
  }

  const configList: KeyControlConfig[] = [];
  let keyControlOptions: KeyControlActionOptions = {
    configList,
  };

  let currentIndex = 0;
  function getIndex() {
    return currentIndex++;
  }
</script>

<DropdownButton class="flex-1 min-w-0" smaller autoWidth>
  <div class="button" slot="value">
    <span class="text" class:no-target={!structPath}
      >{structPath ?? "None"}</span
    >
    {#if targetResolved}
      <div class="value">
        <FieldIcon columnType={targetResolved.type} />
      </div>
    {/if}
  </div>
  <div
    bind:this={dropdown}
    use:keyControlAction={keyControlOptions}
    class="dropdown"
    slot="dropdown"
  >
    {#each children as child}
      <FieldItem
        value={child}
        level={0}
        keyControlActionOptions={keyControlOptions}
        scrollContainer={dropdown}
        {getIndex}
      />
    {/each}
  </div>
</DropdownButton>

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded p-1.5 h-[inherit] overflow-y-auto overflow-x-hidden min-w-[100px];
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .button {
    @apply flex flex-grow m-0 min-w-0;
    align-items: center;
    justify-content: stretch;
    box-sizing: border-box;
    flex-basis: 0;
  }

  .button .text {
    @apply flex flex-grow;
  }

  .button .value {
    @apply flex flex-row text-dark-200 px-2;
    column-gap: 4px;
    align-items: center;
    line-height: normal;
  }

  .button .text.no-target {
    @apply text-dark-50;
  }

  .button .icon {
    @apply text-dark-50;
  }

  .button:focus,
  .button:hover,
  .button.show,
  .button.selected {
    .icon {
      @apply text-dark-200;
    }
  }

  .button .text {
    @apply font-medium text-[11px];
  }
</style>
