<script context="module">
	export const ssr = false;
	export const prerender = false;
</script>

<script>
	import CanvasDatagrid from '@datadocs/canvas-datagrid-ng';
  import { escape } from '@datadocs/duckdb-utils';
	import { afterUpdate,beforeUpdate,onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { DuckDB } from '../../lib/DuckDB';
	import { create_table,run_query } from '../../lib/grid_api';

	const mounted = writable(false);

	let db;
	let conn;
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

  let grid_container;
  let canvas_datagrid;
	async function register_file(event) {
	  const file = event.target.files[0];
	  if (!file) {
	    return;
	  }

	  const file_name = file.name;
	  db.registerFileHandle(file_name, file);

	  const table_name = await create_table(conn, file_name, file);
	  const columns = await run_query(conn, `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ${escape(table_name)} ORDER BY ORDINAL_POSITION`);
	  const schema = columns.map((v)=>{
	    return {
	      name: v['column_name']
	    };
	  });

	  const data = (await conn.query(`SELECT * FROM ${table_name}`)).toArray();

	  grid_container.innerHTML = "";
	  canvas_datagrid = CanvasDatagrid({
	    parentNode: grid_container,
	  });
	  canvas_datagrid.attributes.columnHeaderClickBehavior = 'select';
	  canvas_datagrid.style.columnHeaderCellHorizontalAlignment = 'center';
	  canvas_datagrid.style.width = '100%';
	  canvas_datagrid.style.height = '95%';

	  canvas_datagrid.schema = schema;
	  canvas_datagrid.data = data;
	}
</script>

<span>Choose a file</span>
<input
	on:change="{register_file}"
	disabled="{!is_db_ready}"
	type="file"
	accept="text/csv, .xls, .xlsx, .zip, .xml, .json" />

<div bind:this={grid_container} class="h-full"></div>
