/**
 * @packageDocumentation
 * @module app/store-grid
 */
import { datagrid as CanvasDatagrid } from "@datadocs/canvas-datagrid-ng";
import { parseExpression } from "@datadocs/ddc";
import { get } from "svelte/store";

import { bind, openModal } from "../../../components/common/modal";
import { loadingRenderer } from "../../../components/grids/grid-loading";
import QueryConflictModal from "../../../components/grids/modal/QueryConflictModal.svelte";
import { DatadocsGridModalProvider } from "../../../components/grids/modals/grid-modal-provider";
import { getGridTypeFromDatabaseType } from "@datadocs/datasource-duckdb";
import { getDuckDBManagerInstance } from "../store-db";
import { getRootNamespace } from "../store-namespace";
import { queryConflictStrategy } from "../writables";
import { grid, gridDataSource } from "./writables";
import type { ParseResults } from "@datadocs/ddc";
import {
  type OptimizedType,
  type GridPositionForDBQuery,
  createTemporaryTables,
} from "../db-manager";
import type {
  TableSpillBehavior,
  TableStyle,
  GridPublicAPI,
  NormalCellDescriptor,
} from "@datadocs/canvas-datagrid-ng";
import type { DataSourceBase } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/spec/base";
import type { ModalConfigType } from "../../../components/common/modal";
import { FromDuckDb } from "@datadocs/datasource-duckdb";
import type { ExpressionNode } from "@datadocs/ast";
import { ValueNode } from "@datadocs/ast";
import { expandRange } from "../../../utils/helpers";
import { Tick } from "../../../utils/performance";
import { DuckDbQueryOptimization } from "@datadocs/datasource-duckdb";
import { getDuckDBFile } from "../db-manager/opfs";
import { INTERNAL_SCHEMA_NAME } from "../../../components/panels/Sources/constant";
import { createTemporarySourcePanelDatabase } from "../db-manager/uploaded-files";

export * from "./writables";

/** Store grid instance of multiple grid tabs, key is a grid tab identifier */
export const gridsMap = new Map<string, GridPublicAPI>();

/** Keep track of which grids have run the init query from Test Query */
const initGridDataSet: Set<string> = new Set();

declare module "@datadocs/canvas-datagrid-ng/lib/data/data-source/spec/base" {
  export interface CellMeta {
    expressionAst?: ParseResults<ExpressionNode>;
  }
}

function setupGridTransformers(grid: GridPublicAPI) {
  grid.transformers.push((cell, source) => {
    const { cellMeta: meta } = source;
    if (meta?.expressionAst) {
      const { expressionAst } = meta;
      const root: ExpressionNode = expressionAst?.ast?.root;
      if (root) {
        const { metadata } = root;
        const displayValue =
          metadata.canonical ??
          (root instanceof ValueNode ? root.value : metadata.text);
        return Object.assign(cell, {
          type: getGridTypeFromDatabaseType(root.typeName),
          displayValue,
        } as Partial<NormalCellDescriptor>);
      }
    }
    return cell;
  });
}

function setupGridPreview(grid: GridPublicAPI) {
  function expressionPreviewFn() {
    if (!grid.input.editCell) {
      return;
    }
    let text = grid.input.innerText;
    const meta = grid.input.editCell.meta ?? {};
    if (text.startsWith("=")) {
      text = text.substring(1);
    }
    delete meta.preview;
    try {
      const { ast, errors } = parseExpression(text, {
        comparisonAlwaysReturnsBool: true,
        closeUnfinishedTokens: true,
      });
      if (!errors) {
        meta.preview = {
          value: ast.root?.metadata?.canonical,
          dataType: ast.root?.typeName,
        };
      }
    } catch (e) {
      console.error(e);
    }
    const { rowIndex, columnIndex } = grid.input.editCell;
    grid.dataSource.editCells([
      {
        row: rowIndex,
        column: columnIndex,
        meta,
      },
    ]);
  }
  grid.addEventListener("beginedit", () => {
    if (!grid.input) return;
    grid.input.addEventListener("input", expressionPreviewFn);
  });
  grid.addEventListener("endedit", () => {
    if (!grid.input) return;
    grid.input.removeEventListener("input", expressionPreviewFn);
  });
}

/**
 * Get existing grid instance, create new one if not available
 * @param id grid tab identifier
 * @param createNew control if a new grid will be created in case couldn't find
 *     the grid with associated id
 * @returns grid instance of the grid tab
 */
export function getGridInstance(
  id: string,
  createNew = true
): GridPublicAPI & HTMLElement {
  let gridInstance: GridPublicAPI = null;

  if (gridsMap.has(id)) {
    gridInstance = gridsMap.get(id);
  } else if (createNew) {
    const namespace = getRootNamespace();

    gridInstance = CanvasDatagrid({
      allowFreezingRows: true,
      sortFrozenRows: false,
      filterFrozenRows: false,
      formatters: Object.create(null),
      loadingRenderer,
    });
    const dataSource: DataSourceBase = new CanvasDatagrid.DataSources.Empty({
      rows: 1e9,
      cols: 1e5,
    });
    namespace.attachChild(dataSource.namespace);
    gridInstance.modalProvider = new DatadocsGridModalProvider();
    gridInstance.dataSource = dataSource;
    // gridInstance.setPassive(true);
    // setupGridTransformers(gridInstance);

    gridsMap.set(id, gridInstance);
  }

  return gridInstance as any;
}

export function setGridDataInit(id: string) {
  initGridDataSet.add(id);
}

export function isGridDataInit(id: string) {
  return initGridDataSet.has(id);
}

export function updateGridStore(_grid: GridPublicAPI) {
  // grid.set(_grid); /* Active grid is now set by app-manager.ts. So disabling this here */
  gridDataSource.set(_grid.dataSource);
}

/**
 * Remove specific grid instance and reset grid store if the current one in
 * store is going to be deleted
 * @param id grid tab identifier
 */
export function removeGrid(id: string) {
  if (!gridsMap.has(id)) return;
  const namespace = getRootNamespace();
  const removeGrid = gridsMap.get(id);
  const currentGrid = getGrid();
  if (removeGrid === currentGrid) {
    grid.set(null);
    gridDataSource.set(null);
  }
  namespace.detachChild(removeGrid.dataSource.namespace);
  gridsMap.delete(id);
}

/**
 * Get Data source from grid by id
 * @param id
 * @returns DataSource
 */
export function getGridDataSourceById(id: string): DataSourceBase {
  return gridsMap.get(id).dataSource;
}

export function getGridDataSource() {
  let ds = get(gridDataSource);
  if (!ds) {
    ds = new (CanvasDatagrid as any).DataSources.Empty({
      rows: 1e9,
      cols: 1e5,
    });
    gridDataSource.set(ds);
  }
  return ds;
}

export function getGrid() {
  return get(grid);
}

export function getActiveGridId() {
  const activeGrid = getGrid();

  for (const [key, value] of gridsMap.entries()) {
    if (value === activeGrid) return key;
  }

  return "";
}

export function getGridContainingComponent(
  namespace: string
): ReturnType<typeof CanvasDatagrid> | undefined {
  const controller = getRootNamespace();
  const result = controller.getComponent(namespace, true);
  if (!result || result.type === "controller") return;

  for (const grid of gridsMap.values()) {
    const childNs = grid.dataSource?.namespace;
    if (childNs && childNs.contains(result.name)) {
      return grid;
    }
  }
}

export function getGridStore() {
  return grid;
}

export async function createTable(
  viewId: string,
  startPoint: GridPositionForDBQuery,
  querySQL: string,
  optimizationType: OptimizedType,
  tableStyle?: Partial<TableStyle>
) {
  const gridInstance = getGridInstance(viewId);
  const dataSource = gridInstance.dataSource;
  const duckdb = getDuckDBManagerInstance();

  const dbFile = getDuckDBFile();
  await duckdb.queryProvider.useDatabase(dbFile);
  console.log(`loaded "${dbFile}"`);

  const connId = await duckdb.createConnection();
  await createTemporarySourcePanelDatabase();
  await createTemporaryTables(duckdb, connId);
  await duckdb.closeConnection(connId);

  let opt: DuckDbQueryOptimization;
  switch (optimizationType) {
    case "VIEW":
      opt = DuckDbQueryOptimization.CREATE_VIEW;
      break;
    case "BASE TABLE":
    case "VIEW TABLE":
      opt = DuckDbQueryOptimization.CREATE_TABLE;
      break;
    default:
      opt = DuckDbQueryOptimization.NONE;
  }

  const conflictBehavior = get(queryConflictStrategy);
  const tableDataSource = new FromDuckDb({
    schemaName: INTERNAL_SCHEMA_NAME,
    db: duckdb.queryProvider,
    query: { sql: querySQL, opt },
  });

  // prepare the data before binding the data source
  // for avoding the table flickering
  let preloadIDLE: () => Promise<void>;
  try {
    const viewPortRows = expandRange(
      gridInstance.viewport.rowsRange ?? [0, 0],
      50
    );
    const t = new Tick(`preload(${viewPortRows.join(", ")})`);
    const preload = tableDataSource.preload({ rowsRange: viewPortRows });
    t.tick("preload");
    preloadIDLE = preload.idle;
    if (preload.wait) await preload.wait;
    t.tick("wait");
  } catch (error) {
    console.error(`Prepare data for the table failed:`, error);
  }

  const tableName = dataSource.namespace.nextName("table");

  const addTableToDataSource = () => {
    try {
      dataSource.createTable(
        tableName,
        startPoint.rowIndex,
        startPoint.colIndex,
        tableDataSource,
        tableStyle,
        conflictBehavior === "ask" ? "fail" : conflictBehavior
      );
    } catch (e) {
      const props = {
        onResolve: (strategy: TableSpillBehavior) => {
          dataSource.createTable(
            tableName,
            startPoint.rowIndex,
            startPoint.colIndex,
            tableDataSource,
            tableStyle,
            strategy
          );
          const grid = getGrid();
          if (grid !== undefined) grid.draw();
        },
        isMovable: false,
      };

      const modalElement = bind(QueryConflictModal, props);
      const config: ModalConfigType<any> = {
        component: modalElement,
        isMovable: false,
        isResizable: false,
        minWidth: 400,
        minHeight: 300,
        preferredWidth: 500,
      };

      openModal(config);
    }
  };

  gridInstance.draw();
  if (preloadIDLE) {
    setTimeout(() => {
      const t = new Tick("preloadIDLE");
      preloadIDLE().then(() => {
        t.tick("done");
        addTableToDataSource();
      });
    }, 15);
  } else {
    addTableToDataSource();
  }
}

/**
 * Get start point for last selection
 * @param id
 * @returns
 */
export function getStartPoint(id: string): GridPositionForDBQuery {
  const lastSelection = getGridInstance(id).getLastSelection();

  if (!lastSelection) {
    return { rowIndex: 0, colIndex: 0 };
  }

  return {
    rowIndex: lastSelection.startRow,
    colIndex: lastSelection.startColumn,
  };
}

export function updateGridLocale(locale: string) {
  gridsMap.forEach((grid) => grid.setGridLocale(locale));
}
