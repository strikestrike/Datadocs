export const LHS_EQUAL = {

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
      "a": `false`,
      "b": `"hello"`,
      "c": `24`,
      "d": `1.07`,
      "e": `-1.2e2+24`,
      "f": `[1,2,3]`,
      "g": `{"a": 2}`,
      "h": `[1, 2]`,
      "i": `"-Infinity"::Float`,
  },

  // numeric tests
  "numeric": {
      "a": `1e500`,
      "b": `1.00123456789012345678901234567890123456789`,
      "c": `123456789123456789123456789123456789123456789`,
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
      "a": `false`,
      "b": `0`,
      "c": `0.0`,
      "d": `""`,
      "e": `b""`,
      "f": `DATE "0001-01-01"`,
      "g": `DATETIME "0001-01-01T00:00:00"`,
      "h": `TIMESTAMP "0001-01-01T00:00:00Z"`,
      "i": `TIME "00:00:00"`,
      "j": `INTERVAL "P0D"`,
      "k": `[ST_GEOGFROM('POINT EMPTY'), ST_GEOGFROM('LINESTRING EMPTY'), ST_GEOGFROM('POLYGON EMPTY'), ST_GEOGFROM('MULTIPOINT EMPTY'), ST_GEOGFROM('MULTILINESTRING EMPTY'), ST_GEOGFROM('MULTIPOLYGON EMPTY'), ST_GEOGFROM('GEOMETRYCOLLECTION EMPTY')]`,
      "l": `[ST_GEOGFROM('POINT EMPTY'), ST_GEOGFROM('LINESTRING EMPTY'), ST_GEOGFROM('POLYGON EMPTY'), ST_GEOGFROM('MULTIPOINT EMPTY'), ST_GEOGFROM('MULTILINESTRING EMPTY'), ST_GEOGFROM('MULTIPOLYGON EMPTY'), ST_GEOGFROM('GEOMETRYCOLLECTION EMPTY')]`,
      "m": `[JSON null, JSON false, JSON 0, JSON "", JSON [], JSON {}]`,
      "n": `[]`,
  },

  // extra @blank tests
  "extra-blank": {
    "a": `[1,2,0]`,
    "b": `{"x": [0,2,@blank], "d": {"x": ["hi", @blank, ""]}}`,
    "c": `[@blank]`,
    "d": `{"x":@blank}`,
    "e": `[NULL]`,
    "f": `['', 0, @blank]`,
  },
}

export const LHS_INEQUAL = {

  // array tests
  "blank": {
      "a": `[0]`,
      "b": `{"x": null}`,
      "c": `{"x": 0}`,
  },

  // numeric tests
  "numeric": {
      "a": `1.00123456789012345678901234567890123456789`,
      "b": `"Infinity"::FLOAT`,
      "c": `"NaN"::FLOAT`,
  }

}