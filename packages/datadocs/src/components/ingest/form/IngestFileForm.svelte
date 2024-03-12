<script lang="ts" context="module">
  export const ssr = false;
  export const prerender = false;

  export type FormInIngestHandler = {
    tableName: string;
    persistence: boolean;
    dropIfExists: boolean;
  };
</script>

<script lang="ts">
  import FormInput from "../../common/form/FormInput.svelte";
  import Button from "../../common/form/Button.svelte";
  import { createEventDispatcher, onMount } from "svelte";
  import { temporaryFileForIngesting } from "../../../app/store/writables";
  import { getHumanFileSize } from "../../../utils/file";
  import Checkbox from "../../common/form/Checkbox.svelte";
  import { getDuckDBManagerInstance } from "../../../app/store/store-db";
  import { getObjectsFromQueryResult } from "@datadocs/datasource-duckdb";
  import { writable, type Writable } from "svelte/store";
  import Statustext from "./Statustext.svelte";

  export let ingestHandler: (
    form: FormInIngestHandler,
    status: Writable<string | Error>
  ) => Promise<void>;

  const dispatch = createEventDispatcher<{
    create: {};
    close: {};
  }>();
  const fileName = $temporaryFileForIngesting.name;

  let fileInfo: string = fileName;
  let tableName: string = fileName.replace(/\..+?$/, "").replace(/\W+/, "_");
  let persistence = true;
  let dropIfExists = false;
  let status = writable<string | Error>("");
  let ingesting = writable<boolean>(false);

  $: fileInfo;
  onMount(() => {
    $temporaryFileForIngesting.getFile().then((file) => {
      fileInfo = `${fileName} (${getHumanFileSize(file.size)})`;
    });
  });

  async function checkTableNameExistence() {
    const dbManager = getDuckDBManagerInstance();
    if (!dbManager) return;
    const connID: string = await dbManager.createConnection();
    try {
      const rows = getObjectsFromQueryResult(
        await dbManager.all(`SHOW TABLES`, connID)
      );
      const tableNames = rows.map(it=>it.name as string);
      console.log(tableNames);
    } catch (error) {
      console.error(error);
    } finally {
      await dbManager.closeConnection(connID);
    }
  }

  function onCancel() {
    temporaryFileForIngesting.set(undefined);
    dispatch("close");
  }

  async function onCreate() {
    status.set("ingesting...");
    ingesting.set(true);
    try {
      await ingestHandler({ tableName, persistence, dropIfExists }, status);
      // await checkTableNameExistence();
    } catch (error) {
      console.error(error);
      status.set(error);
      ingesting.set(false);
      return
    }
    status.set("ingested");
    setTimeout(onCancel, 1000);
  }
</script>

<div class="firestore-docs-modal">
  <!-- host -->
  <div class="flex flex-row gap-4 mt-7">
    <div class="input-field flex-grow flex-shrink">
      <p class="required">File Info:</p>
      <div class="input-container input-only">
        <FormInput
          disabled
          value={fileInfo}
          name="fileInfo"
          errorIndicatorIconSize="20px"
          type="text"
          spellcheck="false"
          autocomplete="off"
        />
      </div>
    </div>
  </div>

  <div class="input-field mt-7">
    <p class="required">Table Name</p>
    <div class="input-container input-only">
      <FormInput
        bind:value={tableName}
        name="tableName"
        class="focusable"
        errorIndicatorIconSize="20px"
        type="text"
        spellcheck="false"
        placeholder="Enter an unused DuckDB table name"
        autocomplete="off"
      />
    </div>
  </div>

  <div class="input-field mt-7 columns-2">
    <div class="flex flex-row justify-items-center">
      <p class="required mr-2">Persistence</p>
      <Checkbox class="mt-1" bind:checked={persistence} size="15px" />
    </div>
    <div class="flex flex-row justify-items-center">
      <p class="required mr-2">Drop if exists</p>
      <Checkbox class="mt-1" bind:checked={dropIfExists} size="15px" />
    </div>
  </div>

  <!-- control button -->
  <div class="mt-10 flex flex-row justify-between">
    <Statustext {status} />
    <div class="flex flex-row gap-2.5">
      <Button
        type="button"
        color="secondary"
        class="focusable px-5"
        on:click={onCancel}>Cancel</Button
      >
      <Button
        disabled={$ingesting}
        type="button"
        color="primary"
        class="focusable px-5"
        on:click={onCreate}>Ingest</Button
      >
    </div>
  </div>
</div>

<style lang="postcss">
  .firestore-docs-modal {
    padding: 20px 50px 40px;
  }
  .firestore-docs-modal .input-field {
    @apply relative;
  }

  .firestore-docs-modal .input-container {
    position: relative;
  }
</style>
