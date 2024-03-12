export enum DataType {
  Null = 1,
  Float = 3,
  Bytes = 4,
  Decimal = 7,
  Date = 8,
  Time = 9,
  DateTime = 10,
  Interval = 11,
  List = 12,
  Struct = 13,
  Map = 17,
  Json = 18,
  Variant = 19,
  Geography = 20,
  Timestamp = 21,
}

export type BaseTypeWithDetails = {
  typeId: DataType;
};

export type Null_ = BaseTypeWithDetails;

export type Decimal = BaseTypeWithDetails & {
  scale: number;
  precision: number;
  bitWidth: number;
};

export enum DateUnit {
  DAY = 0,
  MILLISECOND = 1,
}
export type Date_ = BaseTypeWithDetails & {
  unit: DateUnit;
};

export enum TimeUnit {
  SECOND = 0,
  MILLISECOND = 1,
  MICROSECOND = 2,
  NANOSECOND = 3,
}
export type Time = BaseTypeWithDetails & {
  unit: TimeUnit;
};
export type DateTime = Time;
export type Timestamp = Time;

export enum IntervalUnit {
  YEAR_MONTH = 0,
  DAY_TIME = 1,
  MONTH_DAY_NANO = 2,
}
export type Interval = BaseTypeWithDetails & {
  unit: IntervalUnit;
};

/**
 * Field information for the columns of the table.
 */
export type Field = {
  name: string;
  displayname?: string;
  type: ColumnType;
};

export enum Precision {
  HALF = 0,
  SINGLE = 1,
  DOUBLE = 2,
}
export type Float = BaseTypeWithDetails & {
  precision: Precision;
};

export type Bytes = BaseTypeWithDetails;

export type List = BaseTypeWithDetails & {
  child: Field;
};

export type Struct = BaseTypeWithDetails & {
  children: Field[];
};

export type Map_ = BaseTypeWithDetails & {
  children: Field[];
};

export type Json_ = BaseTypeWithDetails;
export type Variant = BaseTypeWithDetails;
export type Geography = BaseTypeWithDetails;

export type ColumnType =
  | 'string'
  | Null_
  | 'number'
  | 'int'
  | 'float'
  | 'date'
  | Float
  | 'boolean'
  | Date_
  | 'bytes'
  | Bytes
  | Decimal
  | Time
  | DateTime
  | Interval
  | List
  | Struct
  | Map_
  | Json_
  | Geography
  | 'formula'
  | 'html';
