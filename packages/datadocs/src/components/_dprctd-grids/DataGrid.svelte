<script context="module">
  export const ssr = false;
  export const prerender = false;
</script>

<script lang="ts">
  import { onMount } from "svelte";

  import { writable } from "svelte/store";

  import { beforeUpdate, afterUpdate } from "svelte";

  // New version
  import { DuckDB } from "../../lib/DuckDB";

  import {
    create_table,
    run_query,
    generates_empty_data,
    update_local_cache,
  } from "../../lib/grid_api";

  import { datagrid as CanvasDatagrid } from "@datadocs/canvas-datagrid-ng";
  import type { AsyncDuckDB, AsyncDuckDBConnection} from "@datadocs/duckdb-wasm";
import { DuckDBDataProtocol } from "@datadocs/duckdb-wasm";
  import { escape, escapeId } from "@datadocs/duckdb-utils";

  const mounted = writable(false);

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
    mounted.set(true);
  });

  beforeUpdate(() => {});

  afterUpdate(() => {});

  async function query_data(table_name: string, offset: number, rows: number) {
    const escaped_name = escapeId(table_name, true);
    const query_str = `SELECT * FROM ${escaped_name} LIMIT ${rows} OFFSET ${offset}`;
    const data = await conn.query(query_str);
    return data.toArray();
  }

  let grid_container: HTMLElement;
  let canvas_datagrid: any;
  let cache_data: any[];
  async function register_file(event: any) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const file_name = file.name;

    db.registerFileHandle(file_name, file, DuckDBDataProtocol.BROWSER_FILEREADER, false);
    const table_name = await create_table(conn, file_name, file);

    const escaped_name = escapeId(table_name, true);
    const num_rows = (
      await run_query(conn, `SELECT COUNT(*) as num_rows FROM ${escaped_name}`)
    )[0]["num_rows"][0];
    const columns = await run_query(
      conn,
      `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ${escape(table_name)} ORDER BY ORDINAL_POSITION`
    );
    let schema = columns.map((v) => {
      return {
        name: v["column_name"],
        isColDef: true,
      };
    });

    cache_data = generates_empty_data(schema, num_rows);

    // load first page data
    const first_page_data: any[] = Array.from(
      await query_data(table_name, 0, 100)
    );
    update_local_cache(
      first_page_data,
      0,
      cache_data,
      schema,
      1 /*canvas_datagrid.fixedRowCount*/
    );

    grid_container.innerHTML = "";
    canvas_datagrid = CanvasDatagrid({
      parentNode: grid_container,
      sortFrozenRows: false,
      filterFrozenRows: false,
    });
    canvas_datagrid.style.width = "100%";
    canvas_datagrid.style.height = "100%";

    schema = canvas_datagrid.refresh_AZ(schema);

    canvas_datagrid.schema = schema;
    canvas_datagrid.data = cache_data;

    canvas_datagrid.addEventListener("scroll", async function () {
      function is_data_fetched(
        data: any[],
        top_ridx: number,
        bottom_ridx: number
      ) {
        for (let i = top_ridx; i < bottom_ridx; i++) {
          if (data[i].loaded === false) {
            return false;
          }
        }
        return true;
      }

      const top_ridx = canvas_datagrid.scrollIndexRect.top,
        bottom_ridx = canvas_datagrid.scrollIndexRect.bottom;

      if (!is_data_fetched(cache_data, top_ridx, bottom_ridx)) {
        const offset = top_ridx,
          n_rows = bottom_ridx - top_ridx;

        const updated_data = Array.from(
          await query_data(table_name, offset, n_rows)
        );
        update_local_cache(
          updated_data,
          offset,
          cache_data,
          schema,
          canvas_datagrid.fixedRowCount
        );
        canvas_datagrid.draw();
      }
    });
  }
</script>

<div class="h-full w-full flex flex-col">
  <div>
    <span>choose a file</span>
    <input
      on:change={register_file}
      disabled={!is_db_ready}
      type="file"
      accept="text/csv, .xls, .xlsx, .zip, .xml, .json"
    />
  </div>
  <!-- <div bind:this="{gridHolder}" class="h-full"> </div> -->
  <div bind:this={grid_container} class="grid-container" />
</div>

<style src="./Ingest.less"></style>
