<script lang="ts">
  import type { AsyncDuckDB, AsyncDuckDBConnection } from "@datadocs/duckdb-wasm";
  import { datagrid as CanvasDatagrid } from "@datadocs/canvas-datagrid-ng";
  import { afterUpdate, beforeUpdate, onMount } from "svelte";
  import type { Writable} from "svelte/store";
import { writable } from "svelte/store";
  import { watchResize } from "svelte-watch-resize";
  import { selectedFile } from "../../app/store/store-main";
  import { DuckDB } from "../../lib/DuckDB";
  import {
    creates_schema,
    generates_empty_data,
    update_local_cache,
  } from "../../lib/grid_api";
  import QueryToolbar from "../toolbars/QueryToolbar/QueryToolbar.svelte";
  import MainStatusBar from "../toolbars/MainStatusBar/MainStatusBar.svelte";

  /* Props */
  export let layoutClasses = "";
  export let hasNextPane = false;

  /* State */
  const mounted: Writable<boolean> = writable(false);

  let db: AsyncDuckDB;
  let conn: AsyncDuckDBConnection;
  let is_db_ready = false;

  const init = async () => {
    db = await DuckDB();
    conn = await db.connect();
    is_db_ready = true;
  };

  mounted.subscribe((value) => {
    if (value === true) {
      setTimeout(init, 0);
    }
  });

  onMount(async () => {
    // Initialize Grid
    // createGrid();
    mounted.set(true);
  });

  beforeUpdate(() => {});

  afterUpdate(() => {});

  function handleResize(node) {
    const newWidth = node.clientWidth;
    if (newWidth < 1000) {
      displayMode = "medium";
    } else {
      displayMode = "large";
    }
  }

  async function send_query(query_str: string) {
    const query_result = await conn.send(query_str);

    let batch = (await query_result.next()).value;
    const field_names = [];
    for (const field of batch.schema.fields) {
      field_names.push(field.name);
    }

    const data = [];
    while (batch.length > 0) {
      for (const row of batch) {
        const r = {};
        for (const f of field_names) {
          r[f] = row[f];
        }
        data.push(r);
      }
      batch = (await query_result.next()).value;
      if (!batch) break;
    }

    return data;
  }

  async function run_query(query_str: string) {
    const query_result = await conn.query(query_str);

    const field_names = [];
    for (const field of query_result.schema.fields) {
      field_names.push(field.name);
    }

    const data = [];
    if (query_result.numRows > 0) {
      for (const row of query_result) {
        const r = {};
        for (const f of field_names) {
          r[f] = row[f];
        }
        data.push(r);
      }
    }

    return data;
  }

  async function run_query_example(
    query_str: string,
    is_run_query = true
  ) {
    console.log("============= Start running query ============= ");
    console.log(`Query: ${query_str}`);

    let query_method: Function;
    if (is_run_query) {
      query_method = run_query;
      console.log("Method: runQuery");
    } else {
      query_method = send_query;
      console.log("Method: sendQuery");
    }
    const t1 = new Date().getTime();
    const result = await query_method(query_str);

    const t2 = new Date().getTime();
    console.log("Result: ", result);
    console.log(`Running query time: ${t2 - t1}ms`);
    console.log("\n\n");
    return result;
  }

  async function create_table(file_name: string, file: File) {
    const t1 = new Date().getTime();
    const table_name = file_name.split(".")[0];
    const query = `CREATE TABLE IF NOT EXISTS '${table_name}' AS (SELECT * FROM '${file.name}')`;
    await conn.query(query);
    const t2 = new Date().getTime();
    console.log(`====== Time to create Table ====== ${t2 - t1}ms`);

    // await run_query_example(`SELECT * FROM '${table_name}' LIMIT 100`, false);
    // await run_query_example(`SELECT territory_id, count(*) FROM '${table_name}' GROUP BY territory_id`, false);

    // await run_query_example(`SELECT territory_id, count(*) FROM '${table_name}' GROUP BY territory_id LIMIT 10 OFFSET 10`, false);

    // await run_query_example(`SELECT * FROM '${table_name}' LIMIT 10000`, true);
    // await run_query_example(`SELECT territory_id, count(*) FROM '${table_name}' GROUP BY territory_id`, true);
    return table_name;
  }

  async function load_data(
    offset: number,
    num_item: number,
    table_name: string
  ) {
    if (offset > 0) {
      return run_query_example(
        `SELECT * FROM '${table_name}' LIMIT ${num_item} OFFSET ${offset}`,
        true
      );
    } else {
      return run_query_example(
        `SELECT * FROM '${table_name}' LIMIT ${num_item}`,
        true
      );
    }
  }

  async function data_adapter(
    offset: number,
    rows: number,
    table_name: string
  ) {
    const updated_data = await load_data(offset, rows, table_name);
    update_local_cache(updated_data, offset, dataCache, schema);
  }

  let grid_container: HTMLElement;
  var canvas_datagrid: any;
  var dataCache: any[];
  var schema: any[];
  async function register_file(event: Event) {
    const file: File = (event.target as HTMLInputElement).files[0];
    if (!file) {
      return;
    }

    const file_name = file.name;

    selectedFile.set(file);

    db.registerFileHandle(file_name, file);
    const table_name = await create_table(file_name, file);
    const num_rows = (
      await run_query_example(
        `SELECT COUNT(*) as num_rows FROM '${table_name}'`,
        false
      )
    )[0]["num_rows"][0];
    const columns = await run_query_example(
      `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table_name}' ORDER BY ORDINAL_POSITION`
    );
    schema = creates_schema(columns);
    dataCache = generates_empty_data(schema, num_rows);
    // let data = await run_query_example(`SELECT * FROM '${table_name}' LIMIT 100`, false);

    grid_container.innerHTML = "";
    canvas_datagrid = CanvasDatagrid({
      parentNode: grid_container,
    });
    canvas_datagrid.attributes.columnHeaderClickBehavior = "select";
    canvas_datagrid.style.columnHeaderCellHorizontalAlignment = "center";
    canvas_datagrid.style.width = "100%";
    canvas_datagrid.style.height = "100%";
    canvas_datagrid.schema = schema;

    canvas_datagrid.data = dataCache;
    // Load first 100 data
    data_adapter(0, 100, table_name);
    canvas_datagrid.draw();
    canvas_datagrid.addEventListener("scroll", function () {
      function handle_load() {
        if (
          canvas_datagrid.data.filter(function (d: any, i: number) {
            return (
              i > canvas_datagrid.scrollIndexRect.top &&
              i < canvas_datagrid.scrollIndexRect.bottom &&
              d.loaded === false
            );
          }).length > 0
        ) {
          var offset = canvas_datagrid.scrollIndexRect.top,
            rows =
              canvas_datagrid.scrollIndexRect.bottom -
              canvas_datagrid.scrollIndexRect.top;
          offset -= 5;
          offset = offset < 0 ? 0 : offset;
          rows += 10;
          data_adapter(offset, rows, table_name);
          canvas_datagrid.draw();
        }
      }
      handle_load();
    });
  }

  $: displayMode = "large";
</script>

<div
  class={`datagrid ${layoutClasses} ${displayMode}`}
  class:has-next-pane={hasNextPane}
  use:watchResize={handleResize}
>
  <div class="main flex flex-col flex-grow">
    <div class="query-toolbar">
      <QueryToolbar />
    </div>

    <div class="grid-holder flex-grow">
      {#if $selectedFile === null}
        <div class="p-4">
          <span>Choose a file</span>
          <input
            on:change={register_file}
            disabled={!is_db_ready}
            type="file"
            accept="text/csv, .xls, .xlsx, .zip, .xml, .json"
            class="border-0 rounded-sm"
          />
        </div>
      {/if}
      <!-- <div bind:this="{gridHolder}" class="h-full"> </div> -->
      {#if $selectedFile !== null}
        <div bind:this={grid_container} class={`grid-container h-full`} />
      {/if}
    </div>
  </div>

  <div class="status-bar-holder w-full bg-[inherit] flex-grow-0 flex-shrink-0">
    <MainStatusBar numberOfSheets={3} />
  </div>
</div>

<style lang="postcss">
  .datagrid {
    @apply flex flex-col;
    width: calc(100% - 8px);
    height: calc(100% - 16px);
    margin: 8px 4px;
    flex-shrink: 0;
  }

  .has-next-pane {
    height: calc(100% - 12px);
    margin: 8px 4px 4px 4px;
  }

  .main {
    @apply bg-white rounded;
    box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.16);
  }

  .query-toolbar {
    @apply bg-white border default-border rounded;
    margin: 8px;
    margin-bottom: 0;
  }

  .grid-holder {
    @apply bg-white border default-border rounded flex-auto;
    margin: 8px;
  }

  .status-bar-holder {
    height: 29px;
  }

  /* .large .status-bar-holder {
    height: 39px;
  }

  .medium .status-bar-holder {
    height: 74px;
  } */
</style>
