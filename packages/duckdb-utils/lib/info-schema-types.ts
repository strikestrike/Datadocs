// see https://duckdb.org/docs/sql/information_schema.html
import type { Utf8, Int32 } from 'apache-arrow';

type ToArrowType<T> = T extends object
  ? { [key in keyof T]: ToArrowType<T[key]> }
  : T extends string
  ? Utf8
  : T extends number
  ? Int32
  : unknown;

export type InfoSchemaSchemaMetaArrowType = ToArrowType<InfoSchemaSchemaMeta>;
export type InfoSchemaTablesArrowType = ToArrowType<InfoSchemaTables>;
export type InfoSchemaColumnsArrowType = ToArrowType<InfoSchemaColumns>;

/**
 * The top level catalog view is `information_schema.schemata`.
 * It lists the catalogs and the schemas present in the database and has the following layout:
 */
export type InfoSchemaSchemaMeta = {
  /** Name of the database that the schema is contained in.
   * @example NULL
   */
  catalog_name: string;
  /** Name of the schema.
   * @example 'main'
   */
  schema_name: string;
  /** Name of the owner of the schema. Not yet implemented.
   * @example NULL
   */
  schema_owner: string;
  /** Applies to a feature not available in DuckDB.
   * @example NULL
   */
  default_character_set_catalog: string;
  /** Applies to a feature not available in DuckDB.
   * @example NULL
   */
  default_character_set_schema: string;
  /** Applies to a feature not available in DuckDB.
   * @example NULL
   */
  default_character_set_name: string;
  /** The file system location of the database. Currently unimplemented.
   * @example NULL
   */
  sql_path: string;
};

/**
 * The view that describes the catalog information for tables and views is
 * `information_schema.tables`.
 * It lists the tables present in the database and has the following layout:
 */
export type InfoSchemaTables = {
  /** The catalog the table or view belongs to.
   * @example NULL
   */
  table_catalog: string;
  /** The schema the table or view belongs to.
   * @example 'main'
   */
  table_schema: string;
  /** The name of the table or view.
   * @example 'widgets'
   */
  table_name: string;
  /** The type of table. One of: BASE TABLE, LOCAL TEMPORARY, VIEW.
   * @example 'BASE TABLE'
   */
  table_type: string;
  /** Applies to a feature not available in DuckDB.
   * @example NULL
   */
  self_referencing_column_name: string;
  /** Applies to a feature not available in DuckDB.
   * @example NULL
   */
  reference_generation: string;
  /** If the table is a typed table, the name of the database that contains the underlying data type (always the current database), else null. Currently unimplemented.
   * @example NULL
   */
  user_defined_type_catalog: string;
  /** If the table is a typed table, the name of the schema that contains the underlying data type, else null. Currently unimplemented.
   * @example NULL
   */
  user_defined_type_schema: string;
  /** If the table is a typed table, the name of the underlying data type, else null. Currently unimplemented.
   * @example NULL
   */
  user_defined_type_name: string;
  /** YES if the table is insertable into, NO if not (Base tables are always insertable into, views not necessarily.)
   * @example 'YES'
   */
  is_insertable_into: string;
  /** YES if the table is a typed table, NO if not.
   * @example 'NO'
   */
  is_typed: string;
  /** Not yet implemented.
   * @example 'NO'
   */
  commit_action: string;
};

/**
 * The view that describes the catalog information for columns is `information_schema.columns`.
 * It lists the column present in the database and has the following layout:
 */
export type InfoSchemaColumns = {
  /** Name of the database containing the table.
   * @example NULL
   */
  table_catalog: string;
  /** Name of the schema containing the table.
   * @example 'main'
   */
  table_schema: string;
  /** Name of the table.
   * @example 'widgets'
   */
  table_name: string;
  /** Name of the column.
   * @example 'price'
   */
  column_name: string;
  /** Ordinal position of the column within the table (count starts at 1).
   * @example 5
   */
  ordinal_position: number;
  /** Default expression of the column.
   * @example 1.99
   */
  column_default: string;
  /** YES if the column is possibly nullable, NO if it is known not nullable.
   * @example 'YES'
   */
  is_nullable: string;
  /** Data type of the column.
   * @example 'DECIMAL(18, 2)'
   */
  data_type: string;
  /** If data_type identifies a character or bit string type, the declared maximum length; null for all other data types or if no maximum length was declared.
   * @example 255
   */
  character_maximum_length: number;
  /** If data_type identifies a character type, the maximum possible length in octets (bytes) of a datum; null for all other data types. The maximum octet length depends on the declared character maximum length (see above) and the character encoding.
   * @example 1073741824
   */
  character_octet_length: number;
  /** If data_type identifies a numeric type, this column contains the (declared or implicit) precision of the type for this column. The precision indicates the number of significant digits. For all other data types, this column is null.
   * @example 18
   */
  numeric_precision: number;
  /** If data_type identifies a numeric type, this column contains the (declared or implicit) scale of the type for this column. The precision indicates the number of significant digits. For all other data types, this column is null.
   * @example 2
   */
  numeric_scale: number;
  /** If data_type identifies a date, time, timestamp, or interval type, this column contains the (declared or implicit) fractional seconds precision of the type for this column, that is, the number of decimal digits maintained following the decimal point in the seconds value. No fractional seconds are currently supported in DuckDB. For all other data types, this column is null.
   * @example 0
   */
  datetime_precision: number;
};
