import { describe, expect, it } from "vitest";
import { parseStringToGridData } from "../../src/app/store/parser/grid-value";
import { ParserFreeformMeta } from "../../src/app/store/parser/freeform/types";
import { Geometry } from "wkx";
import { supportedLocaleList } from "../../src/app/store/parser/freeform/constants";
import { Locale } from "../../src/app/store/parser/freeform/locale";

let numberFreeformCellTestData: {
  input: string;
  output: ParserFreeformMeta;
  localeKey?: string;
}[] = [
  // for integer
  {
    input: "1",
    output: {
      data: { value: { a: 1n, b: 0 }, dataType: "int" },
      format: {
        decimalSeparator: ".",
        format: "default",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: false,
      },
    },
  },
  {
    input: "-100",
    output: {
      data: { value: { a: -100n, b: 0 }, dataType: "int" },
      format: {
        decimalSeparator: ".",
        format: "default",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: false,
      },
    },
  },
  {
    input: "123456789",
    output: {
      data: { value: { a: 123456789n, b: 0 }, dataType: "int" },
      format: {
        decimalSeparator: ".",
        format: "default",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: false,
      },
    },
  },
  {
    input: "1,000",
    output: {
      data: { value: { a: 1000n, b: 0 }, dataType: "int" },
      format: {
        decimalSeparator: ".",
        format: "default",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  {
    input: "-1,000,123",
    output: {
      data: { value: { a: -1000123n, b: 0 }, dataType: "int" },
      format: {
        decimalSeparator: ".",
        format: "default",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  {
    input: "-1,0001,2334",
    output: {
      data: { value: { a: -100012334n, b: 0 }, dataType: "int" },
      format: {
        decimalSeparator: ".",
        format: "default",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  {
    input: "1234,001,2334",
    output: {
      data: { value: { a: 12340012334n, b: 0 }, dataType: "int" },
      format: {
        decimalSeparator: ".",
        format: "default",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  // test valid for locale vi
  {
    input: "-1.0001.2334",
    output: {
      data: { value: { a: -100012334n, b: 0 }, dataType: "int" },
      format: {
        decimalSeparator: ",",
        format: "default",
        locale: "vi",
        thounsandSeparator: ".",
        type: "number",
        useGrouping: true,
      },
    },
    localeKey: "vi",
  },
  {
    input: "1234.001.2334",
    output: {
      data: { value: { a: 12340012334n, b: 0 }, dataType: "int" },
      format: {
        decimalSeparator: ",",
        format: "default",
        locale: "vi",
        thounsandSeparator: ".",
        type: "number",
        useGrouping: true,
      },
    },
    localeKey: "vi",
  },
  //test invalid for locale vi
  {
    input: "-1,0001,2334",
    output: {
      data: { value: "-1,0001,2334", dataType: "string" },
    },
    localeKey: "vi",
  },
  {
    input: "1234,001,2334",
    output: {
      data: { value: "1234,001,2334", dataType: "string" },
    },
    localeKey: "vi",
  },
  // test valid for locale fr
  {
    input: "-1 0001 2334",
    output: {
      data: { value: { a: -100012334n, b: 0 }, dataType: "int" },
      format: {
        decimalSeparator: ",",
        format: "default",
        locale: "fr",
        thounsandSeparator: " ",
        type: "number",
        useGrouping: true,
      },
    },
    localeKey: "fr",
  },
  {
    input: "1234 001 2334",
    output: {
      data: { value: { a: 12340012334n, b: 0 }, dataType: "int" },
      format: {
        decimalSeparator: ",",
        format: "default",
        locale: "fr",
        thounsandSeparator: " ",
        type: "number",
        useGrouping: true,
      },
    },
    localeKey: "fr",
  },
  //test invalid for locale vi
  {
    input: "-1,0001,2334",
    output: {
      data: { value: "-1,0001,2334", dataType: "string" },
    },
    localeKey: "fr",
  },
  {
    input: "1234,001,2334",
    output: {
      data: { value: "1234,001,2334", dataType: "string" },
    },
    localeKey: "fr",
  },
  // test for currency
  {
    input: "$1",
    output: {
      data: { value: { a: 1n, b: 0 }, dataType: "int" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ".",
        format: "currency",
        locale: "en",
        position: "head",
        symbol: "$",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: false,
      },
    },
  },
  {
    input: "€1",
    output: {
      data: { value: { a: 1n, b: 0 }, dataType: "int" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ",",
        format: "currency",
        locale: "fr",
        position: "head",
        symbol: "€",
        thounsandSeparator: " ",
        type: "number",
        useGrouping: false,
      },
    },
    localeKey: "fr",
  },
  {
    input: "₫1",
    output: {
      data: { value: { a: 1n, b: 0 }, dataType: "int" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ",",
        format: "currency",
        locale: "vi",
        position: "head",
        symbol: "₫",
        thounsandSeparator: ".",
        type: "number",
        useGrouping: false,
      },
    },
    localeKey: "vi",
  },
  {
    input: "1$",
    output: {
      data: { value: { a: 1n, b: 0 }, dataType: "int" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ".",
        format: "currency",
        locale: "en",
        position: "tail",
        symbol: "$",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: false,
      },
    },
  },
  {
    input: "1€",
    output: {
      data: { value: { a: 1n, b: 0 }, dataType: "int" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ",",
        format: "currency",
        locale: "fr",
        position: "tail",
        symbol: "€",
        thounsandSeparator: " ",
        type: "number",
        useGrouping: false,
      },
    },
    localeKey: "fr",
  },
  {
    input: "1₫",
    output: {
      data: { value: { a: 1n, b: 0 }, dataType: "int" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ",",
        format: "currency",
        locale: "vi",
        position: "tail",
        symbol: "₫",
        thounsandSeparator: ".",
        type: "number",
        useGrouping: false,
      },
    },
    localeKey: "vi",
  },
  // test invalid currency for locale
  {
    input: "1€",
    output: {
      data: { value: "1€", dataType: "string" },
    },
  },
  {
    input: "1₫",
    output: {
      data: { value: "1₫", dataType: "string" },
    },
    localeKey: "fr",
  },
  {
    input: "1$",
    output: {
      data: { value: "1$", dataType: "string" },
    },
    localeKey: "vi",
  },
  // test for currency and decimal separator
  {
    input: "1233,000,111$",
    output: {
      data: { value: { a: 1233000111n, b: 0 }, dataType: "int" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ".",
        format: "currency",
        locale: "en",
        position: "tail",
        symbol: "$",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  {
    input: "1233 000 111€",
    output: {
      data: { value: { a: 1233000111n, b: 0 }, dataType: "int" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ",",
        format: "currency",
        locale: "fr",
        position: "tail",
        symbol: "€",
        thounsandSeparator: " ",
        type: "number",
        useGrouping: true,
      },
    },
    localeKey: "fr",
  },
  {
    input: "1233.000.111₫",
    output: {
      data: { value: { a: 1233000111n, b: 0 }, dataType: "int" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ",",
        format: "currency",
        locale: "vi",
        position: "tail",
        symbol: "₫",
        thounsandSeparator: ".",
        type: "number",
        useGrouping: true,
      },
    },
    localeKey: "vi",
  },
  {
    input: "1233,000,111   $",
    output: {
      data: { value: { a: 1233000111n, b: 0 }, dataType: "int" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ".",
        format: "currency",
        locale: "en",
        position: "tail",
        symbol: "$",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  {
    input: "   $    1233,000,111",
    output: {
      data: { value: { a: 1233000111n, b: 0 }, dataType: "int" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ".",
        format: "currency",
        locale: "en",
        position: "head",
        symbol: "$",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  // invalid integer
  {
    input: "-1,0001,000,23",
    output: { data: { value: "-1,0001,000,23", dataType: "string" } },
  },
  {
    input: "1 1,000,230",
    output: { data: { value: "1 1,000,230", dataType: "string" } },
  },
  {
    input: "1000 % $",
    output: { data: { value: "1000 % $", dataType: "string" } },
  },
  // for float
  {
    input: "1e2",
    output: {
      data: { value: 100, dataType: "float" },
      format: {
        decimalSeparator: ".",
        format: "default",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: false,
      },
    },
  },
  {
    input: "-1.23e12",
    output: {
      data: { value: -1230000000000, dataType: "float" },
      format: {
        decimalSeparator: ".",
        format: "default",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: false,
      },
    },
  },
  // decimal separator for float and locale vi
  {
    input: "-1,23e12",
    output: {
      data: { value: -1230000000000, dataType: "float" },
      format: {
        decimalSeparator: ",",
        format: "default",
        locale: "vi",
        thounsandSeparator: ".",
        type: "number",
        useGrouping: false,
      },
    },
    localeKey: "vi",
  },
  // decimal separator for float and locale fr
  {
    input: "-1,23e12",
    output: {
      data: { value: -1230000000000, dataType: "float" },
      format: {
        decimalSeparator: ",",
        format: "default",
        locale: "fr",
        thounsandSeparator: " ",
        type: "number",
        useGrouping: false,
      },
    },
    localeKey: "fr",
  },
  // test valid decimal, thounsand separators for en
  {
    input: "1,000.32e32",
    output: {
      data: { value: 1.00032e35, dataType: "float" },
      format: {
        decimalSeparator: ".",
        format: "default",
        useGrouping: true,
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
      },
    },
  },
  // test valid decimal, thounsand separators for vi
  {
    input: "1.000,32e32",
    output: {
      data: { value: 1.00032e35, dataType: "float" },
      format: {
        decimalSeparator: ",",
        format: "default",
        useGrouping: true,
        locale: "vi",
        thounsandSeparator: ".",
        type: "number",
      },
    },
    localeKey: "vi",
  },
  // test valid decimal, thounsand separators for fr
  {
    input: "1 000,32e32",
    output: {
      data: { value: 1.00032e35, dataType: "float" },
      format: {
        decimalSeparator: ",",
        format: "default",
        useGrouping: true,
        locale: "fr",
        thounsandSeparator: " ",
        type: "number",
      },
    },
    localeKey: "fr",
  },
  // test invalid decimal, thounsand separators for en
  {
    input: "1.000,32e32",
    output: {
      data: { value: "1.000,32e32", dataType: "string" },
    },
  },
  // test invalid decimal, thounsand separators for vi
  {
    input: "1 000,32e32",
    output: {
      data: { value: "1 000,32e32", dataType: "string" },
    },
    localeKey: "vi",
  },
  // test invalid decimal, thounsand separators for fr
  {
    input: "1,000.32e32",
    output: {
      data: { value: "1,000.32e32", dataType: "string" },
    },
    localeKey: "fr",
  },
  {
    input: "1e-23",
    output: {
      data: { value: 1e-23, dataType: "float" },
      format: {
        decimalSeparator: ".",
        format: "default",
        useGrouping: false,
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
      },
    },
  },
  {
    input: "-1,0001,2334e32",
    output: {
      data: { value: -1.00012334e40, dataType: "float" },
      format: {
        decimalSeparator: ".",
        format: "default",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  {
    input: "-1,2334e-32",
    output: {
      data: { value: -1.2334e-28, dataType: "float" },
      format: {
        decimalSeparator: ".",
        format: "default",
        useGrouping: true,
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
      },
    },
  },
  {
    input: "$2332,233e2",
    output: {
      data: { value: 233223300, dataType: "float" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ".",
        format: "currency",
        locale: "en",
        position: "head",
        symbol: "$",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  {
    input: "2332,233e2$",
    output: {
      data: { value: 233223300, dataType: "float" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ".",
        format: "currency",
        locale: "en",
        position: "tail",
        symbol: "$",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  {
    input: "2332.233e2₫",
    output: {
      data: { value: 233223300, dataType: "float" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ",",
        format: "currency",
        locale: "vi",
        position: "tail",
        symbol: "₫",
        thounsandSeparator: ".",
        type: "number",
        useGrouping: true,
      },
    },
    localeKey: "vi",
  },
  {
    input: "1,000%",
    output: {
      data: { value: 10, dataType: "float" },
      format: {
        decimalPlaces: 2,
        decimalSeparator: ".",
        format: "percent",
        type: "number",
        useGrouping: true,
        locale: "en",
        thounsandSeparator: ",",
      },
    },
  },
  {
    input: "%1",
    output: {
      data: { value: 0.01, dataType: "float" },
      format: {
        decimalPlaces: 2,
        decimalSeparator: ".",
        format: "percent",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: false,
      },
    },
  },
  {
    input: "%1e2",
    output: {
      data: { value: 1, dataType: "float" },
      format: {
        decimalPlaces: 2,
        decimalSeparator: ".",
        format: "percent",
        type: "number",
        locale: "en",
        thounsandSeparator: ",",
        useGrouping: false,
      },
    },
  },
  // for decimal
  // locale en
  {
    input: "1.23",
    output: {
      data: { value: { a: 1230000000n, b: 9 }, dataType: "decimal" },
      format: {
        decimalSeparator: ".",
        format: "default",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: false,
      },
    },
  },
  {
    input: "123,456.23",
    output: {
      data: { value: { a: 123456230000000n, b: 9 }, dataType: "decimal" },
      format: {
        decimalSeparator: ".",
        format: "default",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  // locale vi
  {
    input: "1,23",
    output: {
      data: { value: { a: 1230000000n, b: 9 }, dataType: "decimal" },
      format: {
        decimalSeparator: ",",
        format: "default",
        locale: "vi",
        thounsandSeparator: ".",
        type: "number",
        useGrouping: false,
      },
    },
    localeKey: "vi",
  },
  {
    input: "123.456,23",
    output: {
      data: { value: { a: 123456230000000n, b: 9 }, dataType: "decimal" },
      format: {
        decimalSeparator: ",",
        format: "default",
        locale: "vi",
        thounsandSeparator: ".",
        type: "number",
        useGrouping: true,
      },
    },
    localeKey: "vi",
  },
  // locale fr
  {
    input: "1,23",
    output: {
      data: { value: { a: 1230000000n, b: 9 }, dataType: "decimal" },
      format: {
        decimalSeparator: ",",
        format: "default",
        locale: "fr",
        thounsandSeparator: " ",
        type: "number",
        useGrouping: false,
      },
    },
    localeKey: "fr",
  },
  {
    input: "123 456,23",
    output: {
      data: { value: { a: 123456230000000n, b: 9 }, dataType: "decimal" },
      format: {
        decimalSeparator: ",",
        format: "default",
        locale: "fr",
        thounsandSeparator: " ",
        type: "number",
        useGrouping: true,
      },
    },
    localeKey: "fr",
  },
  // test invalid decimal for decimal, thounsand separators and locale
  // locale en
  {
    input: "123 456.23",
    output: {
      data: { value: "123 456.23", dataType: "string" },
    },
  },
  // locale vi
  {
    input: "1.32",
    output: {
      data: { value: 1956528000000, dataType: "date" },
    },
    localeKey: "vi",
  },
  {
    input: "123,456.23",
    output: {
      data: { value: "123,456.23", dataType: "string" },
    },
    localeKey: "vi",
  },
  // locale fr
  {
    input: "1.232",
    output: {
      data: { value: 921600000, dataType: "interval" },
    },
    localeKey: "fr",
  },
  {
    input: "123.456,23",
    output: {
      data: { value: "123.456,23", dataType: "string" },
    },
    localeKey: "fr",
  },
  // test valid
  {
    input: "-123,456.23",
    output: {
      data: { value: { a: -123456230000000n, b: 9 }, dataType: "decimal" },
      format: {
        decimalSeparator: ".",
        format: "default",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  {
    input: "1,2332.23",
    output: {
      data: { value: { a: 12332230000000n, b: 9 }, dataType: "decimal" },
      format: {
        decimalSeparator: ".",
        format: "default",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  {
    input: "1,2332.23%",
    output: {
      data: { value: { a: 123322300000n, b: 9 }, dataType: "decimal" },
      format: {
        decimalPlaces: 2,
        decimalSeparator: ".",
        format: "percent",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  {
    input: "%-123,456.23",
    output: {
      data: { value: { a: -1234562300000n, b: 9 }, dataType: "decimal" },
      format: {
        decimalPlaces: 2,
        decimalSeparator: ".",
        format: "percent",
        locale: "en",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  {
    input: "1,2332.23$",
    output: {
      data: { value: { a: 12332230000000n, b: 9 }, dataType: "decimal" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ".",
        format: "currency",
        locale: "en",
        position: "tail",
        symbol: "$",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  {
    input: "$   -123,456.23",
    output: {
      data: { value: { a: -123456230000000n, b: 9 }, dataType: "decimal" },
      format: {
        currency: "usd",
        decimalPlaces: 2,
        decimalSeparator: ".",
        format: "currency",
        locale: "en",
        position: "head",
        symbol: "$",
        thounsandSeparator: ",",
        type: "number",
        useGrouping: true,
      },
    },
  },
  // invalid decimal
  {
    input: "-123,456.23,232",
    output: {
      data: { value: "-123,456.23,232", dataType: "string" },
    },
  },
  {
    input: "-1234,56.23232",
    output: {
      data: { value: "-1234,56.23232", dataType: "string" },
    },
  },
];

describe("Test datadocs parser freeform cell data for integer, float, decimal", () => {
  let locale: Locale = new Locale(supportedLocaleList["en"]);
  for (let i = 0; i < numberFreeformCellTestData.length; i++) {
    let { input, output, localeKey } = numberFreeformCellTestData[i];
    input = input.substring(0);
    let displayOutput = String(output);
    try {
      displayOutput = JSON.stringify(output);
    } catch (error) {}

    if (!localeKey || !supportedLocaleList[localeKey]) {
      localeKey = "en";
    }

    it(`${input} should be ${displayOutput}`, () => {
      if (locale.locale != localeKey) {
        locale = new Locale(supportedLocaleList[localeKey as string]);
      }
      const parsedData = parseStringToGridData(input, locale);
      //   console.log(input, " value => ", parsedData);
      expect(output).toEqual(parsedData);
    });
  }
});

let boolFreeformCellTestData: {
  input: string;
  output: ParserFreeformMeta;
}[] = [
  {
    input: "true",
    output: { data: { value: true, dataType: "boolean" } },
  },
  {
    input: "false",
    output: { data: { value: false, dataType: "boolean" } },
  },
  {
    input: "TRUE",
    output: { data: { value: true, dataType: "boolean" } },
  },
  {
    input: "FALSE",
    output: { data: { value: false, dataType: "boolean" } },
  },
  {
    input: "TrUe",
    output: { data: { value: true, dataType: "boolean" } },
  },
  {
    input: "FalSe",
    output: { data: { value: false, dataType: "boolean" } },
  },
  // Invalid boolean
  {
    input: "true1",
    output: { data: { value: "true1", dataType: "string" } },
  },
  {
    input: "1false",
    output: { data: { value: "1false", dataType: "string" } },
  },
];

describe("Test datadocs parser freeform cell data for boolean", () => {
  for (let i = 0; i < boolFreeformCellTestData.length; i++) {
    let { input, output } = boolFreeformCellTestData[i];
    input = input.substring(0);
    let displayOutput = String(output);
    try {
      displayOutput = JSON.stringify(output);
    } catch (error) {}

    it(`${input} should be ${displayOutput}`, () => {
      const parsedData = parseStringToGridData(input);
      //   console.log(input, " value => ", parsedData);
      expect(output).toEqual(parsedData);
    });
  }
});

let geoFreeformCellTestData: {
  input: string;
  output: ParserFreeformMeta;
}[] = [
  {
    input: "Point(1 1)",
    output: { data: { value: "POINT(1 1)", dataType: "geography" } },
  },
  {
    input: "Linestring(0 0, 1 1, 2 1, 2 2)",
    output: {
      data: { value: "LINESTRING(0 0,1 1,2 1,2 2)", dataType: "geography" },
    },
  },
  {
    input: "POLygon((0 0, 1 0, 1 1, 0 1, 0 0))",
    output: {
      data: { value: "POLYGON((0 0,1 0,1 1,0 1,0 0))", dataType: "geography" },
    },
  },
  {
    input: "polygon((0 0, 10 0, 10 10, 0 10, 0 0),(1 1, 1 2, 2 2, 2 1, 1 1))",
    output: {
      data: {
        value: "POLYGON((0 0,10 0,10 10,0 10,0 0),(1 1,1 2,2 2,2 1,1 1))",
        dataType: "geography",
      },
    },
  },
  {
    input: "MULTIpoint(0 0, 1 1)",
    output: {
      data: { value: "MULTIPOINT(0 0,1 1)", dataType: "geography" },
    },
  },
  {
    input: "MULTILinestring((2 2, 3 4), (5 6, 7 7))",
    output: {
      data: {
        value: "MULTILINESTRING((2 2,3 4),(5 6,7 7))",
        dataType: "geography",
      },
    },
  },
  {
    input: "MULTIpolygon(((0 -1, 1 0, 0 1, 0 -1)), ((1 0, 2 -1, 2 1, 1 0)))",
    output: {
      data: {
        value: "MULTIPOLYGON(((0 -1,1 0,0 1,0 -1)),((1 0,2 -1,2 1,1 0)))",
        dataType: "geography",
      },
    },
  },
  {
    input:
      "GEOMETRYCOLLECTION(POINT (40 10), LINESTRING (10 10, 20 20, 10 40))",
    output: {
      data: {
        value: "GEOMETRYCOLLECTION(POINT(40 10),LINESTRING(10 10,20 20,10 40))",
        dataType: "geography",
      },
    },
  },
  {
    input: "1, 20",
    output: {
      data: { value: "POINT(1 20)", dataType: "geography" },
    },
  },
  {
    input: "10,20",
    output: {
      data: { value: "POINT(10 20)", dataType: "geography" },
    },
  },
  {
    input: "10.23,20.2",
    output: {
      data: { value: "POINT(10.23 20.2)", dataType: "geography" },
    },
  },
  // invalid geography
  {
    input: "100,20",
    output: {
      data: { value: "100,20", dataType: "string" },
    },
  },
  {
    input: "Point(100 100)",
    output: { data: { value: "Point(100 100)", dataType: "string" } },
  },
];

describe("Test datadocs parser freeform cell data for geography", () => {
  for (let i = 0; i < geoFreeformCellTestData.length; i++) {
    let { input, output } = geoFreeformCellTestData[i];
    input = input.substring(0);
    let displayOutput = String(output);
    try {
      displayOutput = JSON.stringify(output);
    } catch (error) {}

    it(`${input} should be ${displayOutput}`, () => {
      const parsedData = parseStringToGridData(input);
      //   console.log(input, " value => ", parsedData);
      expect(output.data.dataType).toEqual(parsedData.data.dataType);
      if (output.data.dataType === "geography") {
        let str = Geometry.parse(Buffer.from(parsedData.data.value)).toWkt();
        // console.log("str ====== ", str);
        expect(output.data.value).toEqual(str);
      } else {
        expect(output.data.value).toEqual(parsedData.data.value);
      }
    });
  }
});

let intervalFreeformCellTestData: {
  input: string;
  output: ParserFreeformMeta;
}[] = [
  {
    input: "27:29",
    output: { data: { value: 98940000, dataType: "interval" } },
  },
  {
    input: "0.01:03:03",
    output: { data: { value: 3783000, dataType: "interval" } },
  },
  {
    input: "01:9293:02.1",
    output: { data: { value: 561182100, dataType: "interval" } },
  },
  {
    input: "1:23:00.23423i",
    output: { data: { value: 4980234.23, dataType: "interval" } },
  },
  {
    input: "0.01:12",
    output: { data: { value: 4320000, dataType: "interval" } },
  },
  {
    input: "01:02i",
    output: { data: { value: 3720000, dataType: "interval" } },
  },
  {
    input: "555i",
    output: { data: { value: 1998000000, dataType: "interval" } },
  },
];

describe("Test datadocs parser freeform cell data for interval", () => {
  for (let i = 0; i < intervalFreeformCellTestData.length; i++) {
    let { input, output } = intervalFreeformCellTestData[i];
    input = input.substring(0);
    let displayOutput = String(output);
    try {
      displayOutput = JSON.stringify(output);
    } catch (error) {}

    it(`${input} should be ${displayOutput}`, () => {
      const parsedData = parseStringToGridData(input);
      //   console.log(input, " value => ", parsedData);
      expect(output).toEqual(parsedData);
    });
  }
});

let dateFreeformCellTestData: {
  input: string;
  output: ParserFreeformMeta;
  localeKey?: string;
}[] = [
  {
    input: "3/14/12",
    output: { data: { value: 1331683200000, dataType: "date" } },
  },
  {
    input: "3/14",
    output: { data: { value: 1678752000000, dataType: "date" } },
  },
  {
    input: "2012-01-01",
    output: { data: { value: 1325376000000, dataType: "date" } },
  },
  {
    input: "14-mar",
    output: { data: { value: 1678752000000, dataType: "date" } },
  },
  {
    input: "14-mar-12",
    output: { data: { value: 1331683200000, dataType: "date" } },
  },
  {
    input: "jan 1, 2014",
    output: { data: { value: 1388534400000, dataType: "date" } },
  },
  {
    input: "Sun, March 23, 2015",
    output: { data: { value: 1427068800000, dataType: "date" } },
  },
  // Invalid date for locale en
  {
    input: "3.14.12",
    output: { data: { value: 309600120, dataType: "interval" } },
  },
  {
    input: "3,14,12",
    output: { data: { value: "3,14,12", dataType: "string" } },
  },
  {
    input: "3/14-12",
    output: { data: { value: "3/14-12", dataType: "string" } },
  },
  // Locale testing
  // vi
  {
    input: "Thg 1 23, 2015",
    output: { data: { value: 1421971200000, dataType: "date" } },
    localeKey: "vi",
  },
  {
    input: "Thứ ba, Tháng 11-23, 2019",
    output: { data: { value: 1574467200000, dataType: "date" } },
    localeKey: "vi",
  },
  {
    input: "Thg 1, 23, 2015",
    output: { data: { value: 1421971200000, dataType: "date" } },
    localeKey: "vi",
  },
  // invalid for locale vi
  {
    input: "1.23,2015",
    output: { data: { value: "1.23,2015", dataType: "string" } },
    localeKey: "vi",
  },
  {
    input: "1/23-2015",
    output: { data: { value: "1/23-2015", dataType: "string" } },
    localeKey: "vi",
  },
  {
    input: "Jan 2015",
    output: { data: { value: "Jan 2015", dataType: "string" } },
    localeKey: "vi",
  },
  // fr
  {
    input: "Dimanche, 23 février, 2019",
    output: { data: { value: 1550880000000, dataType: "date" } },
    localeKey: "fr",
  },
  {
    input: "Février, 2019",
    output: { data: { value: 1548979200000, dataType: "date" } },
    localeKey: "fr",
  },
  {
    input: "Février, 23, 2015",
    output: { data: { value: 1424649600000, dataType: "date" } },
    localeKey: "fr",
  },
  // invalid for locale fr
  {
    input: "1.23,2015",
    output: { data: { value: "1.23,2015", dataType: "string" } },
    localeKey: "fr",
  },
  {
    input: "1/23-2015",
    output: { data: { value: "1/23-2015", dataType: "string" } },
    localeKey: "fr",
  },
  // locale "vi" fail for mar, sunday
  {
    input: "Sunday, Mar-23, 2019",
    output: { data: { value: "Sunday, Mar-23, 2019", dataType: "string" } },
    localeKey: "vi",
  },
  // locale "fr" fail for en date
  {
    input: "January, 2019",
    output: { data: { value: "January, 2019", dataType: "string" } },
    localeKey: "fr",
  },
];

describe("Test datadocs parser freeform cell data for date", () => {
  let locale: Locale = new Locale(supportedLocaleList["en"]);
  for (let i = 0; i < dateFreeformCellTestData.length; i++) {
    let { input, output, localeKey } = dateFreeformCellTestData[i];
    input = input.substring(0);
    let displayOutput = String(output);
    try {
      displayOutput = JSON.stringify(output);
    } catch (error) {}

    if (!localeKey || !supportedLocaleList[localeKey]) {
      localeKey = "en";
    }

    it(`${input} should be ${displayOutput}`, () => {
      if (locale.locale != localeKey) {
        locale = new Locale(supportedLocaleList[localeKey as string]);
      }
      const parsedData = parseStringToGridData(input, locale);
      console.log(input, " value => ", parsedData);
      expect(output).toEqual(parsedData);
    });
  }
});

let timeFreeformCellTestData: {
  input: string;
  output: ParserFreeformMeta;
  localeKey?: string;
}[] = [
  {
    input: "1 p",
    output: { data: { value: 46800000, dataType: "time" } },
  },
  {
    input: "1 pm",
    output: { data: { value: 46800000, dataType: "time" } },
  },
  {
    input: "0:1",
    output: { data: { value: 60000, dataType: "time" } },
  },
  {
    input: "1:12 p",
    output: { data: { value: 47520000, dataType: "time" } },
  },
  {
    input: "1:12 pm",
    output: { data: { value: 47520000, dataType: "time" } },
  },
  {
    input: "1:1.141",
    output: { data: { value: 3660141, dataType: "time" } },
  },
  // Locale testing
  // vi
  {
    input: "1:12 s",
    output: { data: { value: 4320000, dataType: "time" } },
    localeKey: "vi",
  },
  {
    input: "1:12:21.123 CH",
    output: { data: { value: 47541123, dataType: "time" } },
    localeKey: "vi",
  },
  // fr
  {
    input: "1:12 pm",
    output: { data: { value: 47520000, dataType: "time" } },
    localeKey: "fr",
  },
  {
    input: "1 A",
    output: { data: { value: 3600000, dataType: "time" } },
    localeKey: "fr",
  },
  // locale "en" fail for sa/ch (vi)
  {
    input: "1:12 sa",
    output: { data: { value: "1:12 sa", dataType: "string" } },
  },
  // locale "vi" fail for am/pm
  {
    input: "1:12 pm",
    output: { data: { value: "1:12 pm", dataType: "string" } },
    localeKey: "vi",
  },
  // locale "fr" fail for sa/ch (vi)
  {
    input: "1:10:31 sa",
    output: { data: { value: "1:10:31 sa", dataType: "string" } },
    localeKey: "fr",
  },
];

describe("Test datadocs parser freeform cell data for time", () => {
  let locale: Locale = new Locale(supportedLocaleList["en"]);
  for (let i = 0; i < timeFreeformCellTestData.length; i++) {
    let { input, output, localeKey } = timeFreeformCellTestData[i];
    input = input.substring(0);
    let displayOutput = String(output);
    try {
      displayOutput = JSON.stringify(output);
    } catch (error) {}

    if (!localeKey || !supportedLocaleList[localeKey]) {
      localeKey = "en";
    }

    it(`${input} should be ${displayOutput}`, () => {
      if (locale.locale != localeKey) {
        locale = new Locale(supportedLocaleList[localeKey as string]);
      }
      const parsedData = parseStringToGridData(input, locale);
      //   console.log(input, " value => ", parsedData);
      expect(output).toEqual(parsedData);
    });
  }
});

let datetimeFreeformCellTestData: {
  input: string;
  output: ParserFreeformMeta;
  localeKey?: string;
}[] = [
  {
    input: "11/27/86 1 pm",
    output: { data: { value: 533480400000, dataType: "datetime" } },
  },
  {
    input: "jan 1, 2010 8 pm",
    output: { data: { value: 1262376000000, dataType: "datetime" } },
  },
  {
    input: "11/27 0",
    output: { data: { value: 1701043200000, dataType: "datetime" } },
  },
  {
    input: "2014-01-01T01:02:03",
    output: { data: { value: 1388538123000, dataType: "datetime" } },
  },
  {
    input: "2015-01-01 01:02:03 pm",
    output: { data: { value: 1420117323000, dataType: "datetime" } },
  },
  {
    input: "2014-01-01 01:02:03 am",
    output: { data: { value: 1388538123000, dataType: "datetime" } },
  },
  {
    input: "Sun, March 23, 2015 01:02:03",
    output: { data: { value: 1427072523000, dataType: "datetime" } },
  },
  // Locale testing
  // vi
  {
    input: "Thg 1 23, 2015 1 SA",
    output: { data: { value: 1421974800000, dataType: "datetime" } },
    localeKey: "vi",
  },
  {
    input: "Thứ ba, Tháng 11-23, 2019 1:00:1.123 CH",
    output: { data: { value: 1574514001123, dataType: "datetime" } },
    localeKey: "vi",
  },
  // fr
  {
    input: "Dimanche, 23 février, 2019 6:02 AM",
    output: { data: { value: 1550901720000, dataType: "datetime" } },
    localeKey: "fr",
  },
  {
    input: "Février, 2019 1:00:12.234 PM",
    output: { data: { value: 1549026012234, dataType: "datetime" } },
    localeKey: "fr",
  },
  // locale "en" fail for février, Dimanche (fr)
  {
    input: "Dimanche, février-23, 2019 1 SA",
    output: {
      data: { value: "Dimanche, février-23, 2019 1 SA", dataType: "string" },
    },
  },
  // locale "vi" fail for mar, sunday
  {
    input: "Sunday, Mar-23, 2019 1 SA",
    output: {
      data: { value: "Sunday, Mar-23, 2019 1 SA", dataType: "string" },
    },
    localeKey: "vi",
  },
  // locale "fr" fail for en date
  {
    input: "January, 2019 1:00:12 AM",
    output: { data: { value: "January, 2019 1:00:12 AM", dataType: "string" } },
    localeKey: "fr",
  },
];

describe("Test datadocs parser freeform cell data for datetime", () => {
  let locale: Locale = new Locale(supportedLocaleList["en"]);
  for (let i = 0; i < datetimeFreeformCellTestData.length; i++) {
    let { input, output, localeKey } = datetimeFreeformCellTestData[i];
    input = input.substring(0);
    let displayOutput = String(output);
    try {
      displayOutput = JSON.stringify(output);
    } catch (error) {}

    if (!localeKey || !supportedLocaleList[localeKey]) {
      localeKey = "en";
    }

    it(`${input} should be ${displayOutput}`, () => {
      if (locale.locale != localeKey) {
        locale = new Locale(supportedLocaleList[localeKey as string]);
      }
      const parsedData = parseStringToGridData(input, locale);
      //   console.log(input, " value => ", parsedData);
      expect(output).toEqual(parsedData);
    });
  }
});

let timestampFreeformCellTestData: {
  input: string;
  output: ParserFreeformMeta;
  localeKey?: string;
}[] = [
  {
    input: "11/27/86 1 pm Z",
    output: { data: { value: 533480400000, dataType: "timestamp" } },
  },
  {
    input: "jan 1, 2010 8 pm Z",
    output: { data: { value: 1262376000000, dataType: "timestamp" } },
  },
  {
    input: "11/27 0 Z",
    output: { data: { value: 1701043200000, dataType: "timestamp" } },
  },
  {
    input: "2014-01-01T01:02:03.423Z",
    output: { data: { value: 1388538123423, dataType: "timestamp" } },
  },
  {
    input: "2015-01-01 01:02:03.123 pmZ",
    output: { data: { value: 1420117323123, dataType: "timestamp" } },
  },
  {
    input: "2014-01-01 01:02:03 amZ",
    output: { data: { value: 1388538123000, dataType: "timestamp" } },
  },
  {
    input: "Sun, March 23, 2015 01:02:03z",
    output: { data: { value: 1427072523000, dataType: "timestamp" } },
  },
  {
    input: "Sun, March 23, 2015 01:02:03 UTC+2",
    output: { data: { value: 1427065323000, dataType: "timestamp" } },
  },
  {
    input: "Sun, March 23, 2015 01:02:03 GMT-8",
    output: { data: { value: 1427101323000, dataType: "timestamp" } },
  },
  {
    input: "Sun, March 23, 2015 01:02:03 EST",
    output: { data: { value: 1427090523000, dataType: "timestamp" } },
  },
  // Locale testing
  // vi
  {
    input: "Thg 1 23, 2015 1 SA Z",
    output: { data: { value: 1421974800000, dataType: "timestamp" } },
    localeKey: "vi",
  },
  {
    input: "Thứ ba, Tháng 11-23, 2019 1:00:1.123 CH Z",
    output: { data: { value: 1574514001123, dataType: "timestamp" } },
    localeKey: "vi",
  },
  // fr
  {
    input: "Dimanche, 23 février, 2019 6:02 AM Z",
    output: { data: { value: 1550901720000, dataType: "timestamp" } },
    localeKey: "fr",
  },
  {
    input: "Février, 2019 1:00:12.234 PM+11:20",
    output: { data: { value: 1548985212234, dataType: "timestamp" } },
    localeKey: "fr",
  },
  // invalid timezone
  {
    input: "Sun, March 23, 2015 01:02:03 ABC",
    output: { data: { value: "Sun, March 23, 2015 01:02:03 ABC", dataType: "string" } },
  },
  // locale "en" fail for Thg 3, Thứ 7
  {
    input: "Thứ 7, Thg 3-23, 2019 1:00:00+23:00",
    output: {
      data: { value: "Thứ 7, Thg 3-23, 2019 1:00:00+23:00", dataType: "string" },
    },
  },
  // locale "vi" fail for mar, sunday
  {
    input: "Sunday, Mar-23, 2019 1:00:00+23:00",
    output: {
      data: { value: "Sunday, Mar-23, 2019 1:00:00+23:00", dataType: "string" },
    },
    localeKey: "vi",
  },
  // locale "fr" fail for en date
  {
    input: "January, 2019 1:00:12 AM Z",
    output: {
      data: { value: "January, 2019 1:00:12 AM Z", dataType: "string" },
    },
    localeKey: "fr",
  },
];

describe("Test datadocs parser freeform cell data for timestamp", () => {
  let locale: Locale = new Locale(supportedLocaleList["en"]);
  for (let i = 0; i < timestampFreeformCellTestData.length; i++) {
    let { input, output, localeKey } = timestampFreeformCellTestData[i];
    input = input.substring(0);
    let displayOutput = String(output);
    try {
      displayOutput = JSON.stringify(output);
    } catch (error) {}

    if (!localeKey || !supportedLocaleList[localeKey]) {
      localeKey = "en";
    }

    it(`${input} should be ${displayOutput}`, () => {
      if (locale.locale != localeKey) {
        locale = new Locale(supportedLocaleList[localeKey as string]);
      }
      const parsedData = parseStringToGridData(input, locale);
      //   console.log(input, " value => ", parsedData);
      expect(output).toEqual(parsedData);
    });
  }
});

let nestedFreeformCellTestData: {
  input: string;
  output: ParserFreeformMeta;
}[] = [
  {
    input: "[1,2,3]",
    output: {
      data: {
        value: [
          { value: { a: 1n, b: 0 }, dataType: "int" },
          { value: { a: 2n, b: 0 }, dataType: "int" },
          { value: { a: 3n, b: 0 }, dataType: "int" },
        ],
        dataType: "int[]",
      },
    },
  },
  {
    input: "[1.2,2,3]",
    output: {
      data: {
        value: [
          { value: { a: 1200000000n, b: 9 }, dataType: "decimal" },
          { value: { a: 2000000000n, b: 9 }, dataType: "decimal" },
          { value: { a: 3000000000n, b: 9 }, dataType: "decimal" },
        ],
        dataType: "decimal[]",
      },
    },
  },
  {
    input: "[1.2,2,'s']",
    output: {
      data: {
        value: [
          { value: { a: 1200000000n, b: 9 }, dataType: "decimal" },
          { value: { a: 2n, b: 0 }, dataType: "int" },
          { value: "s", dataType: "string" },
        ],
        dataType: "variant[]",
      },
    },
  },
  {
    input: "[1e2,2,78]",
    output: {
      data: {
        value: [
          { value: 100, dataType: "float" },
          { value: 2, dataType: "float" },
          { value: 78, dataType: "float" },
        ],
        dataType: "float[]",
      },
    },
  },
  {
    input: "[1e2,2.334,78]",
    output: {
      data: {
        value: [
          { value: 100, dataType: "float" },
          { value: 2.334, dataType: "float" },
          { value: 78, dataType: "float" },
        ],
        dataType: "float[]",
      },
    },
  },
  {
    input: "{a: 1, b: 2}",
    output: {
      data: {
        value: {
          a: {
            dataType: "int",
            value: { a: 1n, b: 0 },
          },
          b: {
            dataType: "int",
            value: { a: 2n, b: 0 },
          },
        },
        dataType: "struct",
      },
    },
  },
  {
    input: "(1,2)",
    output: {
      data: {
        value: {
          v1: {
            dataType: "int",
            value: { a: 1n, b: 0 },
          },
          v2: {
            dataType: "int",
            value: { a: 2n, b: 0 },
          },
        },
        dataType: "struct",
      },
    },
  },
  // Invalid nested type
  {
    input: "[1,abcd]",
    output: {
      data: {
        value: "[1,abcd]",
        dataType: "string",
      },
    },
  },
  {
    input: "[1,bad word]",
    output: {
      data: {
        value: "[1,bad word]",
        dataType: "string",
      },
    },
  },
  {
    input: "{a: 1, b: abc}",
    output: {
      data: {
        value: "{a: 1, b: abc}",
        dataType: "string",
      },
    },
  },
  {
    input: "(1, abc)",
    output: {
      data: {
        value: "(1, abc)",
        dataType: "string",
      },
    },
  },
];

describe("Test datadocs parser freeform cell data for nested types", () => {
  let locale: Locale = new Locale(supportedLocaleList["en"]);
  for (let i = 0; i < nestedFreeformCellTestData.length; i++) {
    let { input, output } = nestedFreeformCellTestData[i];
    input = input.substring(0);
    let displayOutput = String(output);
    try {
      displayOutput = JSON.stringify(output);
    } catch (error) {}

    it(`${input} should be ${displayOutput}`, () => {
      const parsedData = parseStringToGridData(input, locale);
      //   console.log(input, " value => ", parsedData);
      expect(output).toEqual(parsedData);
    });
  }
});
