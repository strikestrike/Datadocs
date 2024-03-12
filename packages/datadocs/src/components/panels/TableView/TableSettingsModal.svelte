<script lang="ts">
  import Checkbox from "../../common/form/Checkbox.svelte";
  import type {
    DataSourceSettings,
    TableDescriptor,
    TableEvent,
  } from "@datadocs/canvas-datagrid-ng";
  import DropdownSectionTitle from "../../toolbars/MainToolbar/dropdowns/common/DropdownSectionTitle.svelte";
  import { tableInUse } from "../../../app/store/writables";
  import { getContext, onMount } from "svelte";
  import Button from "../../common/form/Button.svelte";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../common/dropdown";
  import AlertBox from "../../common/alert/AlertBox.svelte";

  const notifyCloseDropdown: () => void = getContext(
    CLOSE_DROPDOWN_CONTEXT_NAME
  );

  export let table: TableDescriptor;

  let dsSettings = table.dataSource.getSettings();
  let currentSettings = structuredClone(dsSettings);

  $: hasChanges = checkChanges(dsSettings, currentSettings);

  function notify() {}

  function apply(e: Event) {
    e.preventDefault();
    save();
  }

  async function save() {
    await table.dataSource.updateSettings(currentSettings);
  }

  function checkChanges(a: DataSourceSettings, b: DataSourceSettings) {
    return (
      a.caseSensitive !== b.caseSensitive ||
      a.hideSubtotalsRows !== b.hideSubtotalsRows
    );
  }

  function close(e: Event) {
    e.preventDefault();
    notifyCloseDropdown();
  }

  function onTableEvent(event: TableEvent) {
    if (
      event.type === "datasource" &&
      event.dataSourceEvent.name === "settings"
    ) {
      dsSettings = table.dataSource.getSettings();
    }
  }

  onMount(() => {
    table.addEventListener(onTableEvent);

    const shouldAssignTable = !$tableInUse;
    if (shouldAssignTable) $tableInUse = table;

    return () => {
      table.removeEventListener(onTableEvent);
      if (shouldAssignTable) $tableInUse = undefined;
    };
  });
</script>

<div class="dropdown">
  <DropdownSectionTitle title="Settings" spacing="mx-3.5 my-1.5" />

  <div class="content">
    <AlertBox>
      <svelte:fragment slot="message">
        Settings will be applied to entire table. You can override it
        individually for each category.
      </svelte:fragment>
    </AlertBox>
    <div class="common-setting">
      <label class="cursor-pointer" for="caseInsensitivitySetting"
        >Case-insensitive</label
      >
      <Checkbox
        checked={!currentSettings.caseSensitive}
        id="caseInsensitivitySetting"
        on:checked={({ detail }) => {
          currentSettings.caseSensitive = !detail.value;
          notify();
        }}
      />
    </div>
    <div class="common-setting">
      <label class="cursor-pointer" for="showSubtotalRowsSetting"
        >Show Subtotals</label
      >
      <Checkbox
        checked={!currentSettings.hideSubtotalsRows}
        id="showSubtotalRowsSetting"
        on:checked={({ detail }) => {
          currentSettings.hideSubtotalsRows = !detail.value;
          notify();
        }}
      />
    </div>
  </div>
  <div class="button-container">
    <Button
      color="secondary"
      class="leading-normal ml-auto mr-1.5"
      spacing="px-3 py-1.5"
      on:click={close}
    >
      Cancel
    </Button>
    <Button
      color="primary-accent"
      class="leading-normal"
      spacing="px-3 py-1.5"
      disabled={!hasChanges}
      on:click={apply}
    >
      Apply
    </Button>
  </div>
</div>

<style lang="postcss">
  .dropdown {
    @apply flex flex-col justify-stretch relative bg-white rounded overflow-y-auto overflow-x-hidden text-13px h-full outline-none p-1.5 w-360px;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
    row-gap: 4px;

    > .content {
      @apply flex flex-col overflow-y-auto;
      row-gap: 4px;

      > .common-setting {
        @apply flex flex-row flex-1 py-1.5 pr-2 pl-3.5;
        column-gap: 8px;
        line-height: normal;

        label {
          @apply flex-1;
        }
      }
    }

    > .button-container {
      @apply flex flex-row my-2.5 ml-5 mr-2.5 text-11px;
    }
  }
</style>
