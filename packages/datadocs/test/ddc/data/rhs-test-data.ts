export const RHS_EQUAL = {

  // exact tests
  "base": {
      "a": `false`,
      "b": `1`,
      "c": `1.2`,
      "d": `1.2e-4`,
      "e": `"hi"`,
      "f": `b"hi"`,
      "g": `DATE "2014-01-01"`,
      "h": `DATETIME "2014-01-01T01:02:03"`,
      "i": `TIMESTAMP "2014-01-01T01:02:03Z"`,
      "j": `TIME "01:02:03"`,
      "k": `INTERVAL "P2D"`,
      "l": `ST_GEOGFROM('POINT EMPTY')`,
      "m": `{"a": 1}`,
      "n": `JSON 1`,
      "o": `[1,2,3]`,
  },

  // json tests
  "json": {
      "a": `JSON false`,
      "b": `JSON "hello"`,
      "c": `JSON 24`,
      "d": `JSON 1.07`,
      "e": `JSON -1.2e2+24`,
      "f": `JSON [1,2,3]`,
      "g": `JSON {"a": 2}`,
      "h": `[JSON 1, JSON 2]`,
      "i": `-JSON 1e500`,
  },

  // numeric tests
  "numeric": {
      "a": `1e400`,
      "b": `1.0012345678`,
      "c": `1.23456789123456789E+44`,
      "d": `"Infinity"::FLOAT`,
      "e": `"NaN"::FLOAT`,
  },

  // nested tests
  "nested": {
      "a": `{"a": 1}`,
      "b": `[{"a": 1}, {"a": 1}]`,
      "c": `{"a": [{"a": 1}, {"a": 1}]}`,
      "d": `[{"a": [{"a": 1}, {"a": 1}]}, {"a": [{"a": 1}, {"a": 1}]}]`,
  },

  // @blank tests
  "blank": {
      "a": `@blank`,
      "b": `@blank`,
      "c": `@blank`,
      "d": `@blank`,
      "e": `@blank`,
      "f": `@blank`,
      "g": `@blank`,
      "h": `@blank`,
      "i": `@blank`,
      "j": `@blank`,
      "k": `[ST_GEOGFROM('GEOMETRYCOLLECTION EMPTY'), ST_GEOGFROM('GEOMETRYCOLLECTION EMPTY'), ST_GEOGFROM('GEOMETRYCOLLECTION EMPTY'), ST_GEOGFROM('GEOMETRYCOLLECTION EMPTY'), ST_GEOGFROM('GEOMETRYCOLLECTION EMPTY'), ST_GEOGFROM('GEOMETRYCOLLECTION EMPTY'), ST_GEOGFROM('GEOMETRYCOLLECTION EMPTY')]`,
      "l": `[@blank, @blank, @blank, @blank, @blank, @blank, @blank]`,
      "m": `[@blank, @blank, @blank, @blank, @blank, @blank]`,
      "n": `@blank`,
  },

  // extra @blank tests
  "extra-blank": {
    "a": `[1,2,@blank]`,
    "b": `{"x": [@blank,2,@blank], "d": {"x": ["hi", "", @blank]}}`,
    "c": `[@blank]`,
    "d": `{"x":@blank}`,
    "e": `[@blank]`,
    "f": `['', 0, false]`,
  },
}

export const RHS_INEQUAL = {

  // @blank tests
  "blank": {
      "a": `@blank`,
      "b": `@blank`,
      "c": `@blank`,
  },

  // numeric tests
  "numeric": {
      "a": `1.00123`,
      "b": `"Infinity"`,
      "c": `"NaN"`,
  }

}
