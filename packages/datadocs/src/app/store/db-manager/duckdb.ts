import { DuckDBDataProtocol, type AsyncDuckDB } from "@datadocs/duckdb-wasm";
import type { SchemaChildrenItemResult, TableSchema } from "./types";
import { DataType } from "../../../../../canvas-datagrid-ng/lib/types/column-types";
import { escape, escapeId } from "@datadocs/duckdb-utils";
import { getFileExtension } from "./utils";
import {
  getGridTypeFromDatabaseType,
  transformDuckDBValue,
} from "@datadocs/datasource-duckdb";
import { createDatabaseTableViewItem } from "../panels/store-sources-panel";
import { PersistentDuckDBQueryProvider } from "@datadocs/local-storage";
import {
  DB_COLLECTION_TABLE_NAME,
  DB_COLLECTION_VIEW_NAME,
  type DatabaseTableItem,
  type DatabaseViewItem,
  type ManagedFileTableItem,
  type ManagedFileViewItem,
} from "../panels/sources/type";

export class DuckDBManager {
  readonly queryProvider: PersistentDuckDBQueryProvider;

  constructor(readonly store: AsyncDuckDB) {
    this.queryProvider = new PersistentDuckDBQueryProvider(store, "conn", {
      // we can put config for DuckDB `open` method in here. for exmaple:
      // checkpointWALSize: 0,
    });
  }

  //
  //#region expose query provider methods
  async createConnection(): Promise<string> {
    return this.queryProvider.createConnection();
  }
  hasConnection(connID: string): boolean {
    return this.queryProvider.hasConnection(connID);
  }
  async closeConnection(connID: string): Promise<void> {
    return this.queryProvider.closeConnection(connID);
  }
  async query(sql: string, connID: string) {
    return this.queryProvider.query(sql, connID);
  }
  async all(queryStr: string, connID: string, limit?: number) {
    return await this.queryProvider.queryAll(queryStr, connID, limit);
  }
  //#endregion expose query provider methods
  //

  /**
   * Get updated query from schema
   * @param schema
   * @returns
   */
  getUpdatedQuery(schema: TableSchema, limit: number, offset: number): string {
    const selectItems: string[] = [];
    for (let idx = 0; idx < schema.columns.length; idx++) {
      const column = schema.columns[idx];
      const columnName = column.name;
      if (typeof columnName !== "string" || !columnName) {
        console.warn(
          `Invalid column[${idx}] in table schema, query: ${schema.query}`
        );
        continue;
      }

      const escapedName = escapeId(column.name, true);
      const colType = column.type;
      if (typeof colType === "string") {
        selectItems.push(escapedName);
        // if (colType.toLowerCase() === "date") {
        //   selectItems.push(`(${escapedName})::VARCHAR AS ${escapedName}`);
        // } else {
        //   selectItems.push(escapedName);
        // }
      } else if (typeof colType === "object") {
        switch (colType.typeId) {
          case DataType.Date:
          case DataType.Time:
          case DataType.Float:
          case DataType.Interval:
          case DataType.DateTime:
          case DataType.Timestamp:
          case DataType.Decimal:
          case DataType.Bytes:
          case DataType.List:
          case DataType.Struct:
          case DataType.Json:
          case DataType.Null:
          case DataType.Variant: {
            selectItems.push(escapedName);
            break;
          }
          // case DataType.Interval: {
          //   selectItems.push(escapedName);
          //   break;
          // }
          case DataType.Geography: {
            // selectItems.push(`(${escapedName})::VARCHAR AS ${escapeId(column.displayname)}`);
            selectItems.push(escapedName);
            break;
          }
          default: {
            selectItems.push(
              `(${escapeId})::VARCHAR AS ${escapeId(column.displayname)}`
            );
            break;
          }
        }
      }
    }
    if (offset < 0) {
      offset = 0;
    }
    if (limit <= 0) {
      limit = 100;
    }
    const query =
      `SELECT ${selectItems.join(", ")} FROM ${
        (schema.schemaName ? escapeId(schema.schemaName) + "." : "") +
        schema.tbname
      } ` + `LIMIT ${limit} OFFSET ${offset};`;
    return query;
  }

  /**
   * Get list of schema for duckdb database
   * @param connID
   */
  async getSchemasList(connID: string, catalogName: string): Promise<string[]> {
    let schemas: string[] = [];
    catalogName = catalogName || "memory";
    const get_schema_query_str = `SELECT schema_name FROM information_schema.schemata WHERE catalog_name='${catalogName}'`;
    const records = await this.all(get_schema_query_str, connID);
    for (const record of records) {
      const field = record.schema.fields[0];
      const field_name = field.name;
      for (const v of record) {
        schemas.push(
          transformDuckDBValue(
            v[field_name],
            getGridTypeFromDatabaseType("VARCHAR")
          )
        );
      }
    }
    return [...new Set(schemas)];
  }

  /**
   * Implemented create schema function in duckdb
   * @param connID
   * @param schemaName
   */
  async createSchema(connID: string, schemaName: string): Promise<void> {
    const create_schema_query_str = `CREATE SCHEMA ${schemaName};`;
    await this.query(create_schema_query_str, connID);
  }

  /**
   * Implemented get schema children items function in duckdb
   * @param connID
   * @param schemaName
   * @returns
   */
  async getTablesViewsBySchema(
    connID: string,
    schemaName: string
  ): Promise<SchemaChildrenItemResult[]> {
    const get_schema_children_item_query_str = `SELECT table_name, table_type FROM information_schema.tables WHERE table_schema='${schemaName}'`;
    const records = await this.all(get_schema_children_item_query_str, connID);
    const items: SchemaChildrenItemResult[] = [];
    for (const record of records) {
      const nameField = record.schema.fields[0];
      const typeField = record.schema.fields[1];
      const name = nameField.name;
      const typeName = typeField.name;
      for (const v of record) {
        const typeStr = transformDuckDBValue(
          v[typeName],
          getGridTypeFromDatabaseType("VARCHAR")
        );
        items.push({
          name: transformDuckDBValue(
            v[name],
            getGridTypeFromDatabaseType("VARCHAR")
          ),
          type: typeStr === "BASE TABLE" ? "table" : "view",
        });
      }
    }
    return items;
  }

  async changeDatabaseItemName(
    connID: string,
    schemaName: string,
    type: "TABLE" | "VIEW",
    oldName: string,
    newName: string
  ): Promise<boolean> {
    try {
      const changeNameQueryStr = `ALTER ${type}  ${
        (schemaName ? escapeId(schemaName) + "." : "") + escapeId(oldName)
      } RENAME TO ${escapeId(newName)} `;

      const result = await this.query(changeNameQueryStr, connID);
      return true;
    } catch (e) {
      throw e;
    }
  }

  async dropDatabaseItem(
    connID: string,
    schemaName: string,
    type: "TABLE" | "VIEW",
    name: string
  ): Promise<boolean> {
    try {
      const changeNameQueryStr = `DROP ${type}  ${
        (schemaName ? escapeId(schemaName) + "." : "") + escapeId(name)
      }`;

      await this.query(changeNameQueryStr, connID);
      return true;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Get current active schema for duckdb database
   * @param connID
   */
  async getCurrentSchema(connID: string): Promise<string> {
    let schema: string = null;
    const get_schema_query_str = "SELECT current_schema();";
    const records = await this.all(get_schema_query_str, connID);
    for (const record of records) {
      const field = record.schema.fields[0];
      const field_name = field.name;
      for (const v of record) {
        schema = transformDuckDBValue(
          v[field_name],
          getGridTypeFromDatabaseType("VARCHAR")
        );
      }
    }
    return schema;
  }

  async getDatabaseTableViewItems(
    connID: string,
    schemaIdMap?: { [key: string]: string },
    collectionIdMap?: { [key: string]: string },
    schemaName?: string,
    type?: "dbtable" | "dbview" | "mftable" | "mfview"
  ): Promise<
    (
      | DatabaseTableItem
      | DatabaseViewItem
      | ManagedFileTableItem
      | ManagedFileViewItem
    )[]
  > {
    const tableViewItems: (
      | DatabaseTableItem
      | DatabaseViewItem
      | ManagedFileTableItem
      | ManagedFileViewItem
    )[] = [];
    let tableViewQueryStr = "SELECT * from information_schema.tables";
    if (schemaName || type) {
      tableViewQueryStr += " WHERE ";
      if (schemaName) {
        tableViewQueryStr +=
          `table_schema='${schemaName}'` + (type ? " AND " : "");
      }
      if (type) {
        tableViewQueryStr += `table_type='${
          type === "dbtable" ? "BASE TABLE" : "VIEW"
        }'`;
      }
    }
    tableViewQueryStr += ";";
    const records = await this.all(tableViewQueryStr, connID);
    for (const record of records) {
      for (const v of record) {
        const tbName = transformDuckDBValue(v["table_name"], "string");
        const tbType = transformDuckDBValue(v["table_type"], "string");
        const schName = transformDuckDBValue(v["table_schema"], "string");
        const parentId =
          collectionIdMap &&
          schemaIdMap &&
          collectionIdMap[
            schemaIdMap[schName] +
              "_" +
              (tbType === "BASE TABLE"
                ? DB_COLLECTION_TABLE_NAME
                : DB_COLLECTION_VIEW_NAME)
          ];
        tableViewItems.push(
          createDatabaseTableViewItem(
            tbName,
            parentId,
            tbType === "BASE TABLE" ? "dbtable" : "dbview"
          )
        );
      }
    }
    return tableViewItems;
  }

  /**
   * Imports a file into the database.
   *
   * @param file The file to import.
   * @param name The name of the table to create.
   * @param connID The ID of the connection to use.
   * @param byDatadocsExtension Using DuckDB Datadocs extension
   * function `ingest_file` to import the file
   * @returns The escaped name of the created table.
   */
  async importFile(
    file: File,
    name: string,
    connID: string,
    byDatadocsExtension = false
  ) {
    const ext = getFileExtension(file);
    const fileName = `import_folder/${name}.${ext}`;
    // this.store.registerFileText(fileName, await file.text());
    this.store.registerFileHandle(
      fileName,
      file,
      DuckDBDataProtocol.BROWSER_FILEREADER,
      true
    );

    const escapedName = escapeId(name);
    let sql = `CREATE TABLE ${escapedName} AS SELECT * FROM`;
    if (byDatadocsExtension) sql += ` ingest_file('${fileName}')`;
    else sql += ` '${fileName}'`;
    await this.query(sql, connID);

    this.store.dropFile(fileName);
    return escapedName;
  }

  /**
   * Import File from Uploaded File in Queryable File
   * @param fileName
   * @param name
   * @param connID
   * @param byDatadocsExtension
   */
  async importFileFromUploadedFile(
    fileName: string,
    name: string,
    connID: string,
    byDatadocsExtension = false
  ) {
    if (!(await this.fileExists(fileName))) {
      return null;
    }
    const escapedName = escapeId(name);
    let sql = `CREATE TABLE ${escapedName} AS SELECT * FROM`;
    if (byDatadocsExtension) sql += ` ingest_file('${fileName}')`;
    else sql += ` '${fileName}'`;
    await this.query(sql, connID);

    return fileName;
  }

  async createFile(file: File, fileName: string): Promise<boolean> {
    if (await this.fileExists(fileName)) {
      return false;
    }
    await this.store.registerFileHandle(
      fileName,
      file,
      DuckDBDataProtocol.BROWSER_FILEREADER,
      true
    );

    return true;
  }

  async fileExists(fileName: string): Promise<boolean> {
    const globFile = await this.store.globFiles(fileName);
    return globFile.length > 0;
  }

  async dropFile(fileName: string): Promise<boolean> {
    await this.store.dropFile(fileName);
    return true;
  }
}
