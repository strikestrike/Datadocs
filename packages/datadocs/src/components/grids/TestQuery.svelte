<script context="module">
  export const ssr = false;
  export const prerender = false;
</script>

<script lang="ts">
  import {
    createTable,
    getStartPoint,
    setGridDataInit,
    isGridDataInit,
  } from "../../app/store/grid/base";
  import {
    duckDBManager,
    createConnection,
    closeConnection,
    optimizedType,
    updateOptimizedType,
    queryConflictStrategy,
    getDuckDBManagerInstance,
  } from "../../app/store/store-db";
  import { isTestQuery } from "../../app/store/store-ui";
  import { afterUpdate, createEventDispatcher, onDestroy } from "svelte";
  import type { GridPositionForDBQuery } from "../../app/store/db-manager";
  import { get, type Writable } from "svelte/store";
  import type { TableSpillBehavior } from "@datadocs/canvas-datagrid-ng";
  import { handleOnIngest } from "./ingest-files";
  import {
    ingestedTableName,
    persistentStorageUsage,
  } from "../../app/store/writables";
  import { escapeId, isDQLQuery, parseDuckDBSQL } from "@datadocs/duckdb-utils";
  import { openModal } from "../common/modal";
  import InspectDBModal from "./inspect/InspectDBModal.svelte";
  import { execSQL } from "./exec-sql/exec-sql";
  import { loadQueryPreferences, saveQueryPreferences } from "./preferences";
  import { databasePanelActions } from "../panels/Sources/manager/action";
  import { duckdbDatabaseId } from "../panels/Sources/manager/databaseStateManager";

  const prefs = loadQueryPreferences();

  export let viewId: string;

  let queryStr: string;
  let status = "Loading...";
  let btnText = "Run";
  let tbName: string;
  let temporaryStatus: Writable<{ [key: string]: boolean }>;

  // update query SQL after ingested table
  ingestedTableName.subscribe((tbName) => {
    if (!tbName) return;
    const sql = `SELECT * FROM ${escapeId(tbName)};`;
    queryStr = sql;
    console.log(`queryStr => ${queryStr}`);
    ingestedTableName.set(undefined);
    generateSizeInfo();
  });

  let usedBytes = $persistentStorageUsage;
  function generateSizeInfo() {
    console.log("generateSizeInfo");
    navigator.storage.estimate().then((estimated) => {
      console.log(estimated);
      persistentStorageUsage.set(estimated.usage);
    });
  }

  async function initQuery() {
    if (isGridDataInit(viewId)) {
      return;
    }
    tbName = "test";
    // tbName = gridQueryState.tbname;
    // if (
    //   !connID
    // gridQueryState.loadedData
    // ) {
    // if (gridQueryState.loadedData) {
    //   queryStr = gridQueryState.currentQuery;
    // }
    // return;
    // }
    // Show table
    if (prefs.rememberQuery && prefs.previousQuery) {
      queryStr = prefs.previousQuery;
    } else {
      setDefaultQueryStr();
    }

    if (prefs.runOnStart) {
      await executeTestQuery();
    } else {
      status = "Ready";
    }
  }

  async function executeTestQuery() {
    const startPoint: GridPositionForDBQuery = { rowIndex: 0, colIndex: 0 };
    try {
      await executeQuery(startPoint, queryStr, true);
    } catch (e) {
      if (e.toString() == "Error: query was canceled") {
        status = "Query canceled";
      } else {
        status = e.toString();
        console.error(e);
      }
    }
  }

  async function cancelQuery() {
    const duckdb = getDuckDBManagerInstance();
    if (!duckdb) return;
    const connIds = duckdb.queryProvider.getAllConnectionIds();
    for (const connId of connIds) {
      try {
        await duckdb.closeConnection(connId);
      } catch (error) {
        console.error(`Failed to close conn ${connId}`, error);
      }
    }
  }

  async function executeUserQuery() {
    if (btnText == "Run") {
      console.log("Pressed run button");
      btnText = "Cancel";
      const t1 = new Date().getTime();
      let t2 = t1;
      try {
        // TODO: we have to change the following parser to datadocs SQL parser in the future
        const isDQL = isDQLQuery(parseDuckDBSQL(queryStr).lexer);
        if (prefs.rememberQuery && isDQL) saveQuery(queryStr);

        /** The left-top point that is used to add the table */
        const startPoint: GridPositionForDBQuery = getStartPoint(viewId);
        await executeQuery(startPoint, queryStr, isDQL);
        t2 = new Date().getTime();
        status = "Running query time: " + (t2 - t1) + "ms";
      } catch (e: any) {
        t2 = new Date().getTime();
        if (e.toString() == "Error: query was canceled") {
          status = "Query canceled";
        } else {
          status = e.toString();
        }
      }
    } else {
      console.log("Pressed cancel button");
      await cancelQuery();
    }
    btnText = "Run";
  }

  async function executeQuery(
    startPoint: GridPositionForDBQuery,
    queryStr: string,
    isDQL: boolean,
  ) {
    let optimizedTypeVal = get(optimizedType);
    if (!isDQL) {
      optimizedTypeVal = "BASE TABLE";
    }

    try {
      setGridDataInit(viewId);
      await createTable(viewId, startPoint, queryStr, optimizedTypeVal);
      databasePanelActions.refreshNode(duckdbDatabaseId);
    } catch (error) {
      throw error;
    }
  }

  function openInspectModal() {
    openModal({
      component: InspectDBModal,
      isMovable: false,
      isResizable: false,
      minWidth: 375,
      minHeight: 200,
      preferredWidth: Math.min(window.innerWidth - 20, 720),
    });
  }

  function toggleSettingTable() {
    if (enableTable) {
      updateOptimizedType("VIEW");
    } else {
      updateOptimizedType("BASE TABLE");
    }
  }

  function toggleSettingViewTable() {
    if (enableViewTable) {
      updateOptimizedType("VIEW");
    } else {
      updateOptimizedType("VIEW TABLE");
    }
  }

  function saveQuery(query: string) {
    prefs.previousQuery = query;
    savePrefs();
  }

  function savePrefs() {
    saveQueryPreferences(prefs);
  }

  function setDefaultQueryStr() {
    queryStr = `SELECT * FROM ${tbName};`;
  }

  /**
   * Method used to dispatch custom events
   */
  const dispatch: Function = createEventDispatcher();

  afterUpdate(() => {
    dispatch("updatedTestQuery");
  });

  onDestroy(() => {
    cancelQuery();
  });

  const resolveStrategies: ["ask" | TableSpillBehavior, string][] = [
    ["ask", "Ask"],
    ["spill", "Spill"],
    ["moveToBottom", "Move To Bottom"],
    ["moveToRight", "Move To Right"],
    ["replace", "Replace"],
  ];

  $: isDBReady = $duckDBManager !== null;
  $: $temporaryStatus && $temporaryStatus[tbName], viewId, initQuery();
  $: testQuery = $isTestQuery;
  $: enableTable = $optimizedType === "BASE TABLE";
  $: enableViewTable = $optimizedType === "VIEW TABLE";
</script>

{#if testQuery}
  <div class="toolbar-body">
    <div class="font-medium text-13px">Query:</div>
    <div class="textarea-container">
      <textarea
        name="query_view"
        rows="5"
        bind:value={queryStr}
        on:keydown={(e) => {
          if (
            !e.defaultPrevented &&
            (e.ctrlKey || e.metaKey) &&
            !e.shiftKey &&
            e.key === "Enter"
          ) {
            executeUserQuery();
          }
        }}
        style="width: 100%; max-width: 100%;"
      />
      <div class="query-options-container">
        <div
          class="checkbox-container"
          title="Modify the database persistently"
        >
          <input
            id="persistentQuery"
            type="checkbox"
            bind:checked={prefs.persistence}
            on:change={savePrefs}
          />
          <label for="persistentQuery">Persistence</label>
        </div>
        <div class="checkbox-container" title="Remember the last run query">
          <input
            id="rememberQuery"
            type="checkbox"
            bind:checked={prefs.rememberQuery}
            on:change={savePrefs}
          />
          <label for="rememberQuery">Remember</label>
        </div>
        <div class="checkbox-container" title="Run the test query on start">
          <input
            id="runOnStart"
            type="checkbox"
            bind:checked={prefs.runOnStart}
            on:change={savePrefs}
          />
          <label for="runOnStart">Run on start</label>
        </div>
        <button title="Reset to default query" on:click={setDefaultQueryStr}
          >Reset</button
        >
      </div>
    </div>
  </div>

  <div class="toolbar-footer">
    <div class="footer-status">{status}</div>

    <div class="footer-right">
      <div class="footer-button">
        <button
          title="via ingest_file function in Datadocs extension"
          on:click={handleOnIngest}>Ingest</button
        >
      </div>
      <div class="footer-button light-cyan">
        <button
          title="via ingest_file function in Datadocs extension"
          on:click={openInspectModal}>Inspect</button
        >
      </div>
      <div class="checkbox-container">
        <input
          name="Table"
          type="checkbox"
          checked={enableTable}
          on:change={toggleSettingTable}
        />
        <label class="footer-checkbox-label" for="Table">Table</label>
      </div>
      <div class="checkbox-container">
        <input
          name="ViewTable"
          type="checkbox"
          checked={enableViewTable}
          on:change={toggleSettingViewTable}
        />
        <label class="footer-checkbox-label" for="ViewTable"
          >View, then Table (async)</label
        >
      </div>
      <select class="footer-select-input" bind:value={$queryConflictStrategy}>
        {#each resolveStrategies as [strategy, name]}
          <option value={strategy}>{name}</option>
        {/each}
      </select>
      <div class="footer-button">
        <button disabled={!isDBReady} on:click={executeUserQuery}
          >{btnText}</button
        >
      </div>
    </div>
  </div>
{/if}

<style lang="postcss">
  .toolbar-body {
    @apply flex flex-col;
    padding: 6px 12px 4px 12px;
  }

  .toolbar-body textarea {
    @apply border border-light-100 rounded text-13px font-medium;
    font-family:
      Cascadia Code,
      monospace;
    padding: 3px 6px;
  }

  .textarea-container {
    @apply flex flex-row relative;
    height: calc(100% - var(--query-toolbar-footer-height));
    max-height: calc(100% - var(--query-toolbar-footer-height));
  }

  .query-options-container {
    @apply flex flex-row absolute text-dark-100 rounded bg-white;
    bottom: 8px;
    right: 8px;
    column-gap: 12px;

    button {
      @apply secondary-button rounded px-1.5 py-0.75;
      font-weight: 500;
    }

    button:hover {
      @apply secondary-button-hover;
    }
  }

  .checkbox-container {
    @apply flex flex-column items-center;
    column-gap: 4px;

    input[type="checkbox"] {
      @apply h-11px w-11px;
    }
  }

  .checkbox-container label,
  .query-options-container button {
    @apply text-dark-100 text-11px font-medium;
    line-height: 16px;
  }

  .toolbar-footer {
    @apply flex flex-row items-center;
    height: var(--query-toolbar-footer-height);
    padding: 6px 12px;
    justify-content: space-between;
  }

  .footer-right {
    @apply flex flex-row items-center;
    column-gap: 12px;
  }

  .footer-checkbox-input {
    @apply w-2.5;
    outline: #a7b0b5;
  }

  .footer-select-input {
    @apply bg-light-50 rounded border border-light-100;
    text-align: center;
    font-size: 11px;
    font-weight: 500;
  }

  .footer-checkbox-label,
  .footer-status {
    color: #a7b0b5;
    font-size: 11px;
    font-weight: 500;
  }

  .footer-button button {
    @apply primary-button flex flex-row items-center cursor-pointer self-start text-11px font-medium rounded px-3 py-1;
  }

  .footer-button:hover button {
    @apply primary-button-hover;
  }

  .footer-button.light-cyan button {
    @apply light-cyan-button;
  }
  .footer-button.light-cyan:hover button {
    @apply light-cyan-button-hover;
  }

  .file-container,
  .tablename-container {
    @apply flex flex-row items-center;
    justify-content: center;
  }
  .file-container label,
  .tablename-container label {
    margin-right: 5px;
  }
  .tablename-container input {
    border: solid 1px;
    border-radius: 5px;
    padding: 5px;
  }
</style>
