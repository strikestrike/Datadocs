import type {
  List,
  ParserCellData,
  Variant,
} from '@datadocs/canvas-datagrid-ng';
import { DataType } from '@datadocs/canvas-datagrid-ng';
import { GridTypeName } from '@datadocs/canvas-datagrid-ng/lib/utils/column-types';
import { deepStrictEqual as eq } from 'assert';
import {
  transformDuckDBValue,
  getUTCDateFromString,
} from './transformDuckDBValue';
import { getDuckDBForTest } from '../dev/test-utils';
import type { SimpleDuckDBQueryProvider } from '@datadocs/local-storage';
import { dateTimeToMs } from '@datadocs/canvas-datagrid-ng/lib/data/formatters/interval-formatter/utils';

const {
  BOOLEAN,
  STRING,
  INT,
  FLOAT,
  DECIMAL,
  DATE,
  DATETIME,
  TIME,
  TIMESTAMP,
  BYTES,
  JSON: JSON_TYPE,
  GEOGRAPHY,
  STRUCT,
  NULL,
  INTERVAL,
  VARIANT,
  // UNDEFINED,
} = GridTypeName;
const ARRAY_NOTATION = '[]';

const columnVariantType: Variant = { typeId: DataType.Variant };
const columnVariantListType: List = {
  typeId: DataType.List,
  child: {
    name: 'f',
    type: columnVariantType,
  },
};
const textEncoder = new TextEncoder();
const data: {
  input: string;
  output: ParserCellData;
  description: string;
}[] = [
  {
    input: `SELECT variant(NULL)`,
    output: {
      value: null,
      dataType: NULL,
    },
    description: 'Variant NULL',
  },
  {
    input: `SELECT variant([])`,
    output: {
      value: [],
      dataType: NULL + ARRAY_NOTATION,
    },
    description: 'Variant EMPTY ARRAY',
  },
  {
    input: `SELECT variant(true)`,
    output: {
      value: true,
      dataType: BOOLEAN,
    },
    description: 'Variant BOOLEAN',
  },
  {
    input: `SELECT variant([true, false, null])`,
    output: {
      value: [
        { value: true, dataType: BOOLEAN },
        { value: false, dataType: BOOLEAN },
        { value: null, dataType: BOOLEAN },
      ],
      dataType: BOOLEAN + ARRAY_NOTATION,
    },
    description: 'Variant BOOLEAN[]',
  },
  {
    input: `SELECT variant('Example')`,
    output: {
      value: 'Example',
      dataType: STRING,
    },
    description: 'Variant STRING',
  },
  {
    input: `SELECT variant(['hello', 'world'])`,
    output: {
      value: [
        { value: 'hello', dataType: STRING },
        { value: 'world', dataType: STRING },
      ],
      dataType: STRING + ARRAY_NOTATION,
    },
    description: 'Variant STRING[]',
  },
  {
    input: `SELECT variant(123456)`,
    output: {
      value: 123456,
      dataType: INT,
    },
    description: 'Variant INT',
  },
  {
    input: `SELECT variant([123, 789])`,
    output: {
      value: [
        { value: 123, dataType: INT },
        { value: 789, dataType: INT },
      ],
      dataType: INT + ARRAY_NOTATION,
    },
    description: 'Variant INT[]',
  },
  {
    input: `SELECT variant(1.234e2)`,
    output: {
      value: 123.4,
      dataType: FLOAT,
    },
    description: 'Variant FLOAT',
  },
  {
    input: `SELECT variant([-1.23e-1])`,
    output: {
      value: [{ value: -0.123, dataType: FLOAT }],
      dataType: FLOAT + ARRAY_NOTATION,
    },
    description: 'Variant FLOAT[]',
  },
  {
    input: `SELECT variant(123.456)`,
    output: {
      value: { a: BigInt(123456), b: 3 },
      dataType: DECIMAL,
    },
    description: 'Variant DECIMAL',
  },
  {
    input: `SELECT variant([-123.234, 7.99, NULL])`,
    output: {
      value: [
        { value: { a: -BigInt(123234), b: 3 }, dataType: DECIMAL },
        { value: { a: BigInt(7990), b: 3 }, dataType: DECIMAL },
        { value: null, dataType: DECIMAL },
      ],
      dataType: DECIMAL + ARRAY_NOTATION,
    },
    description: 'Variant DECIMAL[]',
  },
  {
    input: `SELECT variant(DATE '1992-09-20')`,
    output: {
      value: getUTCDateFromString('1992-09-20'),
      dataType: DATE,
    },
    description: 'Variant DATE',
  },
  {
    input: `SELECT variant([DATE '1992-09-20', DATE '2023-02-11'])`,
    output: {
      value: [
        {
          value: getUTCDateFromString('1992-09-20'),
          dataType: DATE,
        },
        {
          value: getUTCDateFromString('2023-02-11'),
          dataType: DATE,
        },
      ],
      dataType: DATE + ARRAY_NOTATION,
    },
    description: 'Variant DATE[]',
  },
  {
    input: `SELECT variant(DATETIME '2022-09-20 17:30:00')`,
    output: {
      value: getUTCDateFromString('2022-09-20 17:30:00'),
      dataType: DATETIME,
    },
    description: 'Variant DATETIME',
  },
  {
    input: `SELECT variant(TIME '17:30:00')`,
    output: {
      value: getUTCDateFromString('1970-01-01 17:30:00'),
      dataType: TIME,
    },
    description: 'Variant TIME',
  },
  {
    input: `SELECT variant(TIMESTAMPTZ '1992-09-20 11:30:00')`,
    output: {
      value: getUTCDateFromString('1992-09-20 11:30:00'),
      dataType: TIMESTAMP,
    },
    description: 'Variant TIMESTAMP',
  },
  {
    input: `SELECT variant('HELLOWORLD'::BLOB)`,
    output: {
      value: textEncoder.encode('HELLOWORLD'),
      dataType: BYTES,
    },
    description: 'Variant BYTES',
  },
  {
    input: `SELECT variant({"a": 1.234, "b": true}::JSON)`,
    output: {
      value: { a: 1.234, b: true },
      dataType: JSON_TYPE,
    },
    description: 'Variant JSON',
  },
  {
    input: `SELECT variant(ST_MAKEPOINT(8, 9))`,
    output: {
      value: `POINT(8 9)`,
      dataType: GEOGRAPHY,
    },
    description: 'Variant GEOGRAPHY',
  },
  {
    input: `SELECT variant(INTERVAL 1 YEAR + INTERVAL 10 DAYS + INTERVAL 3 HOURS)`,
    output: {
      value: dateTimeToMs(1, 0, 10, 3, 0, 0),
      dataType: INTERVAL,
    },
    description: 'Variant INTERVAL',
  },
  {
    input: `SELECT variant({'name': 'John', 'age': 20, 'address': { 'location': ST_MAKEPOINT(8, 9), 'street': 'ABC street' }, 'skills': ['js', 'c++', 'rust']})`,
    output: {
      value: {
        name: { value: 'John', dataType: STRING },
        age: { value: 20, dataType: INT },
        address: {
          value: {
            location: { value: 'POINT(8 9)', dataType: GEOGRAPHY },
            street: { value: 'ABC street', dataType: STRING },
          },
          dataType: STRUCT,
        },
        skills: {
          value: [
            { value: 'js', dataType: STRING },
            { value: 'c++', dataType: STRING },
            { value: 'rust', dataType: STRING },
          ],
          dataType: STRING + ARRAY_NOTATION,
        },
      },
      dataType: STRUCT,
    },
    description: 'Variant STRUCT',
  },
  {
    input: `SELECT variant([{'name': 'John', 'age': 20, 'skills': ['c++', 'rust']}, {'name': 'Doe', 'age': 17, 'skills': ['js', 'c++']}])`,
    output: {
      value: [
        {
          value: {
            name: { value: 'John', dataType: STRING },
            age: { value: 20, dataType: INT },
            skills: {
              value: [
                { value: 'c++', dataType: STRING },
                { value: 'rust', dataType: STRING },
              ],
              dataType: STRING + ARRAY_NOTATION,
            },
          },
          dataType: STRUCT,
        },
        {
          value: {
            name: { value: 'Doe', dataType: STRING },
            age: { value: 17, dataType: INT },
            skills: {
              value: [
                { value: 'js', dataType: STRING },
                { value: 'c++', dataType: STRING },
              ],
              dataType: STRING + ARRAY_NOTATION,
            },
          },
          dataType: STRUCT,
        },
      ],
      dataType: STRUCT + ARRAY_NOTATION,
    },
    description: 'Variant STRUCT[]',
  },
  {
    input: `SELECT variant([variant(1), variant(true)])`,
    output: {
      value: [
        { value: 1, dataType: INT },
        { value: true, dataType: BOOLEAN },
      ],
      dataType: VARIANT + ARRAY_NOTATION,
    },
    description: 'Variant VARIANT[]',
  },
  {
    input: `SELECT variant([variant([true, false]), variant({'name': 'John', 'age': 20, 'skills': ['c++', 'rust']})])`,
    output: {
      value: [
        {
          value: [
            { value: true, dataType: BOOLEAN },
            { value: false, dataType: BOOLEAN },
          ],
          dataType: BOOLEAN + ARRAY_NOTATION,
        },
        {
          value: {
            name: { value: 'John', dataType: STRING },
            age: { value: 20, dataType: INT },
            skills: {
              value: [
                { value: 'c++', dataType: STRING },
                { value: 'rust', dataType: STRING },
              ],
              dataType: STRING + ARRAY_NOTATION,
            },
          },
          dataType: STRUCT,
        },
      ],
      dataType: VARIANT + ARRAY_NOTATION,
    },
    description: 'Variant VARIANT[]',
  },
];

let dbManager: SimpleDuckDBQueryProvider;
async function getValue(queryStr: string) {
  if (!dbManager) {
    const { db, connID } = await getDuckDBForTest();
    dbManager = db;
    await dbManager.closeConnection(connID);
  }

  let value: any;
  const connId = await dbManager.createConnection();
  const records = await dbManager.queryAll(queryStr + ' AS variant', connId);
  for (const record of records) {
    for (const v of record) {
      value = v.variant;
      break;
    }
    if (value) break;
  }
  await dbManager.closeConnection(connId);
  return value;
}

describe('Transform DuckDB VARIANT value', async () => {
  for (const test of data) {
    it(test.description, async () => {
      const value = await getValue(test.input);
      eq(transformDuckDBValue(value, columnVariantType), test.output);
    });
  }
});

const listTypeData: {
  input: string;
  output: any;
  description: string;
}[] = [
  {
    input: `SELECT [variant(true), variant('Example'), variant([123, 789]), variant([-1.23e-1]), variant(123.456)]`,
    output: [
      { value: true, dataType: BOOLEAN },
      { value: 'Example', dataType: STRING },
      {
        value: [
          { value: 123, dataType: INT },
          { value: 789, dataType: INT },
        ],
        dataType: INT + ARRAY_NOTATION,
      },
      {
        value: [{ value: -0.123, dataType: FLOAT }],
        dataType: FLOAT + ARRAY_NOTATION,
      },
      {
        value: { a: BigInt(123456), b: 3 },
        dataType: DECIMAL,
      },
    ],
    description: 'Variant LIST test 1',
  },
  {
    input: `SELECT [variant(DATE '1992-09-20'), variant(DATETIME '2022-09-20 17:30:00'), variant(TIME '17:30:00'), variant(TIMESTAMPTZ '1992-09-20 11:30:00')]`,
    output: [
      {
        value: getUTCDateFromString('1992-09-20'),
        dataType: DATE,
      },
      {
        value: getUTCDateFromString('2022-09-20 17:30:00'),
        dataType: DATETIME,
      },
      {
        value: getUTCDateFromString('1970-01-01 17:30:00'),
        dataType: TIME,
      },
      {
        value: getUTCDateFromString('1992-09-20 11:30:00'),
        dataType: TIMESTAMP,
      },
    ],
    description: 'Variant LIST test 2',
  },
  {
    input: `SELECT [variant('HELLOWORLD'::BLOB), variant({"a": 1.234, "b": true}::JSON), variant(ST_MAKEPOINT(1, 2)), variant(INTERVAL 3 HOURS)]`,
    output: [
      {
        value: textEncoder.encode('HELLOWORLD'),
        dataType: BYTES,
      },
      {
        value: { a: 1.234, b: true },
        dataType: JSON_TYPE,
      },
      {
        value: `POINT(1 2)`,
        dataType: GEOGRAPHY,
      },
      {
        value: dateTimeToMs(0, 0, 0, 3, 0, 0),
        dataType: INTERVAL,
      },
    ],
    description: 'Variant LIST test 3',
  },
  {
    input: `SELECT [variant({'name': 'John', 'skills': ['c++', 'rust']}), variant({'name': 'Doe', 'age': 17})]`,
    output: [
      {
        value: {
          name: { value: 'John', dataType: STRING },
          skills: {
            value: [
              { value: 'c++', dataType: STRING },
              { value: 'rust', dataType: STRING },
            ],
            dataType: STRING + ARRAY_NOTATION,
          },
        },
        dataType: STRUCT,
      },
      {
        value: {
          name: { value: 'Doe', dataType: STRING },
          age: { value: 17, dataType: INT },
        },
        dataType: STRUCT,
      },
    ],
    description: 'Variant LIST test 4',
  },
];

describe('Transform DuckDB VARIANT[] value', async () => {
  for (const test of listTypeData) {
    it(test.description, async () => {
      const value = await getValue(test.input);
      eq(transformDuckDBValue(value, columnVariantListType), test.output);
    });
  }
});
