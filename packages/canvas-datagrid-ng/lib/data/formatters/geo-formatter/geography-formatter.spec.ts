/// <reference types="mocha" />
import { deepEqual } from 'assert';
import type { CellGeographyFormat } from '../../../types/data-format';
import { geographyFormatter } from './geography-formatter';
import { getGeographyData } from '../data-format-tests/util';

const testData: {
  input: string;
  output: string;
  format: CellGeographyFormat['format'];
}[] = [
  // WKT EMPTY
  {
    input: 'POINT EMPTY',
    output: 'POINT EMPTY',
    format: 'WKT',
  },
  {
    input: 'MULTIPOINT EMPTY',
    output: 'MULTIPOINT EMPTY',
    format: 'WKT',
  },
  {
    input: 'LINESTRING EMPTY',
    output: 'LINESTRING EMPTY',
    format: 'WKT',
  },
  {
    input: 'MULTILINESTRING EMPTY',
    output: 'MULTILINESTRING EMPTY',
    format: 'WKT',
  },
  {
    input: 'POLYGON EMPTY',
    output: 'POLYGON EMPTY',
    format: 'WKT',
  },
  {
    input: 'MULTIPOLYGON EMPTY',
    output: 'MULTIPOLYGON EMPTY',
    format: 'WKT',
  },
  {
    input: 'GEOMETRYCOLLECTION EMPTY',
    output: 'GEOMETRYCOLLECTION EMPTY',
    format: 'WKT',
  },
  // WKT POINT/MULTIPOINT
  {
    input: 'POINT(0.24 0)',
    output: 'POINT(0.24 0)',
    format: 'WKT',
  },
  {
    input: 'POINT(1.23 3.45)',
    output: 'POINT(1.23 3.45)',
    format: 'WKT',
  },
  {
    input: 'MULTIPOINT(3 1.23)',
    output: 'MULTIPOINT(3 1.23)',
    format: 'WKT',
  },
  {
    input: 'MULTIPOINT(1.23 3,4 4.56,7.89 9.1)',
    output: 'MULTIPOINT(1.23 3, 4 4.56, 7.89 9.1)',
    format: 'WKT',
  },
  // WKT LINESTRING/MULTILINESTRING
  {
    input: 'LINESTRING(1.23 3,4 4.56,7.89 9.1)',
    output: 'LINESTRING(1.23 3, 4 4.56, 7.89 9.1)',
    format: 'WKT',
  },
  {
    input: 'LINESTRING(30 10,10 30,40 40)',
    output: 'LINESTRING(30 10, 10 30, 40 40)',
    format: 'WKT',
  },
  {
    input: 'MULTILINESTRING((1.23 3,4 4.56,7.89 9.1),(1 2,3 4,5 6,7 8))',
    output: 'MULTILINESTRING((1.23 3, 4 4.56, 7.89 9.1), (1 2, 3 4, 5 6, 7 8))',
    format: 'WKT',
  },
  {
    input: 'MULTILINESTRING((10 10,20 20,10 40),(40 40,30 30,40 20,30 10))',
    output:
      'MULTILINESTRING((10 10, 20 20, 10 40), (40 40, 30 30, 40 20, 30 10))',
    format: 'WKT',
  },
  // WKT POLYGON/MULTIPOLYGON
  {
    input: 'POLYGON((30 10,40 40, 20 40, 10 20, 30 10))',
    output: 'POLYGON((30 10, 40 40, 20 40, 10 20, 30 10))',
    format: 'WKT',
  },
  {
    input: 'POLYGON((1.23 3,4 4.56,7.89 9.1),(3 4,5 6,7 8))',
    output: 'POLYGON((1.23 3, 4 4.56, 7.89 9.1), (3 4, 5 6, 7 8))',
    format: 'WKT',
  },
  {
    input: 'POLYGON((1.23 3,4 4.56,7.89 9.1),(3 4,5 6,7 8),(6 6.5,7 7.8,2 3))',
    output:
      'POLYGON((1.23 3, 4 4.56, 7.89 9.1), (3 4, 5 6, 7 8), (6 6.5, 7 7.8, 2 3))',
    format: 'WKT',
  },
  {
    input:
      'MULTIPOLYGON(((30 20,45 40,10 40,30 20)),((15 5,40 10,10 20,5 10,15 5)))',
    output:
      'MULTIPOLYGON(((30 20, 45 40, 10 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5)))',
    format: 'WKT',
  },
  {
    input:
      'MULTIPOLYGON(((40 40,20 45,45 30,40 40)),((20 35,10 30,10 10,30 5,45 20,20 35),(30 20,20 15,20 25,30 20)))',
    output:
      'MULTIPOLYGON(((40 40, 20 45, 45 30, 40 40)), ((20 35, 10 30, 10 10, 30 5, 45 20, 20 35), (30 20, 20 15, 20 25, 30 20)))',
    format: 'WKT',
  },
  // WKT GEOMETRYCOLLECTION
  {
    input:
      'GEOMETRYCOLLECTION(POINT(40 10),LINESTRING(10 10,20 20,10 40),POLYGON((40 40,20 45,45 30,40 40)))',
    output:
      'GEOMETRYCOLLECTION(POINT(40 10), LINESTRING(10 10, 20 20, 10 40), POLYGON((40 40, 20 45, 45 30, 40 40)))',
    format: 'WKT',
  },
  {
    input:
      'GEOMETRYCOLLECTION(MULTIPOINT(1.23 3,4 4.56,7.89 9.1),MULTILINESTRING((10 10,20 20,10 40),(40 40,30 30,40 20,30 10)),MULTIPOLYGON(((30 20,45 40,10 40,30 20)),((15 5,40 10,10 20,5 10,15 5))))',
    output:
      'GEOMETRYCOLLECTION(MULTIPOINT(1.23 3, 4 4.56, 7.89 9.1), MULTILINESTRING((10 10, 20 20, 10 40), (40 40, 30 30, 40 20, 30 10)), MULTIPOLYGON(((30 20, 45 40, 10 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5))))',
    format: 'WKT',
  },
  {
    input:
      'GEOMETRYCOLLECTION(POINT(40 10),LINESTRING(10 10,20 20,10 40),POLYGON((40 40,20 45,45 30,40 40)),MULTIPOINT(1.23 3,4 4.56,7.89 9.1),MULTILINESTRING((10 10,20 20,10 40),(40 40,30 30,40 20,30 10)),MULTIPOLYGON(((30 20,45 40,10 40,30 20)),((15 5,40 10,10 20,5 10,15 5))))',
    output:
      'GEOMETRYCOLLECTION(POINT(40 10), LINESTRING(10 10, 20 20, 10 40), POLYGON((40 40, 20 45, 45 30, 40 40)), MULTIPOINT(1.23 3, 4 4.56, 7.89 9.1), MULTILINESTRING((10 10, 20 20, 10 40), (40 40, 30 30, 40 20, 30 10)), MULTIPOLYGON(((30 20, 45 40, 10 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5))))',
    format: 'WKT',
  },

  // GeoJSON
  {
    input: 'POINT EMPTY',
    output: '{ "type": "Point", "coordinates": [ ] }',
    format: 'JSON',
  },
  {
    input: 'POINT(30, 10)',
    output: `{ "type": "Point", "coordinates": [30, 10] }`,
    format: 'JSON',
  },
  {
    input: 'MULTIPOINT EMPTY',
    output: '{ "type": "MultiPoint", "coordinates": [ ] }',
    format: 'JSON',
  },
  {
    input: 'MULTIPOINT(1.23 3,4 4.56,7.89 9.1)',
    output:
      '{ "type": "MultiPoint", "coordinates": [ [1.23, 3], [4, 4.56], [7.89, 9.1] ] }',
    format: 'JSON',
  },
  {
    input: 'LINESTRING EMPTY',
    output: '{ "type": "LineString", "coordinates": [ ] }',
    format: 'JSON',
  },
  {
    input: 'LINESTRING(30 10,10 30,40 40)',
    output:
      '{ "type": "LineString", "coordinates": [ [30, 10], [10, 30], [40, 40] ] }',
    format: 'JSON',
  },
  {
    input: 'MULTILINESTRING EMPTY',
    output: '{ "type": "MultiLineString", "coordinates": [ ] }',
    format: 'JSON',
  },
  {
    input: 'MULTILINESTRING((1.23 3,4 4.56,7.89 9.1),(1 2,3 4,5 6,7 8))',
    output:
      '{ "type": "MultiLineString", "coordinates": [ [ [1.23, 3], [4, 4.56], [7.89, 9.1] ], [ [1, 2], [3, 4], [5, 6], [7, 8] ] ] }',
    format: 'JSON',
  },
  {
    input: 'POLYGON EMPTY',
    output: '{ "type": "Polygon", "coordinates": [ ] }',
    format: 'JSON',
  },
  {
    input: 'POLYGON((1.23 3,4 4.56,7.89 9.1),(3 4,5 6,7 8),(6 6.5,7 7.8,2 3))',
    output:
      '{ "type": "Polygon", "coordinates": [ [ [1.23, 3], [4, 4.56], [7.89, 9.1] ], [ [3, 4], [5, 6], [7, 8] ], [ [6, 6.5], [7, 7.8], [2, 3] ] ] }',
    format: 'JSON',
  },
  {
    input: 'MULTIPOLYGON EMPTY',
    output: '{ "type": "MultiPolygon", "coordinates": [ ] }',
    format: 'JSON',
  },
  {
    input:
      'MULTIPOLYGON(((40 40,20 45,45 30,40 40)),((20 35,10 30,10 10,30 5,45 20,20 35),(30 20,20 15,20 25,30 20)))',
    output:
      '{ "type": "MultiPolygon", "coordinates": [ [ [ [40, 40], [20, 45], [45, 30], [40, 40] ] ], [ [ [20, 35], [10, 30], [10, 10], [30, 5], [45, 20], [20, 35] ], [ [30, 20], [20, 15], [20, 25], [30, 20] ] ] ] }',
    format: 'JSON',
  },
  {
    input: 'GEOMETRYCOLLECTION EMPTY',
    output: '{ "type": "GeometryCollection", "geometries": [ ] }',
    format: 'JSON',
  },
  {
    input:
      'GEOMETRYCOLLECTION(POINT(40 10),LINESTRING(10 10,20 20,10 40),POLYGON((40 40,20 45,45 30,40 40)))',
    output:
      '{ "type": "GeometryCollection", "geometries": [ { "type": "Point", "coordinates": [40, 10] }, { "type": "LineString", "coordinates": [ [10, 10], [20, 20], [10, 40] ] }, { "type": "Polygon", "coordinates": [ [ [40, 40], [20, 45], [45, 30], [40, 40] ] ] } ] }',
    format: 'JSON',
  },
  {
    input:
      'GEOMETRYCOLLECTION(MULTIPOINT(1.23 3,4 4.56,7.89 9.1),MULTILINESTRING((10 10,20 20,10 40),(40 40,30 30,40 20,30 10)),MULTIPOLYGON(((30 20,45 40,10 40,30 20)),((15 5,40 10,10 20,5 10,15 5))))',
    output:
      '{ "type": "GeometryCollection", "geometries": [ { "type": "MultiPoint", "coordinates": [ [1.23, 3], [4, 4.56], [7.89, 9.1] ] }, { "type": "MultiLineString", "coordinates": [ [ [10, 10], [20, 20], [10, 40] ], [ [40, 40], [30, 30], [40, 20], [30, 10] ] ] }, { "type": "MultiPolygon", "coordinates": [ [ [ [30, 20], [45, 40], [10, 40], [30, 20] ] ], [ [ [15, 5], [40, 10], [10, 20], [5, 10], [15, 5] ] ] ] } ] }',
    format: 'JSON',
  },

  // DD (DECIMALS DEGREES)
  {
    input: 'POINT EMPTY',
    output: `NaN, NaN`,
    format: 'DD',
  },
  {
    input: 'POINT(0, 0)',
    output: `0, 0`,
    format: 'DD',
  },
  {
    input: 'POINT(30, 10)',
    output: `10, 30`,
    format: 'DD',
  },
  {
    input: 'POINT(-124.0800, 40.8660)',
    output: `40.866, -124.08`,
    format: 'DD',
  },
  {
    input: 'POINT(-124.082778, 40.866389)',
    output: `40.866389, -124.082778`,
    format: 'DD',
  },

  // DMS (DEGREES MINUTES SECONDS)
  {
    input: 'POINT EMPTY',
    output: `NaN, NaN`,
    format: 'DMS',
  },
  {
    input: 'POINT(0 0)',
    output: `0° 0' 0" N, 0° 0' 0" E`,
    format: 'DMS',
  },
  {
    input: 'POINT(30, 10)',
    output: `10° 0' 0" N, 30° 0' 0" E`,
    format: 'DMS',
  },
  {
    input: 'POINT(-124.082778, 40.866389)',
    output: `40° 51' 59" N, 124° 4' 58" W`,
    format: 'DMS',
  },
  {
    input: 'POINT(124.082778, -40.866389)',
    output: `40° 51' 59" S, 124° 4' 58" E`,
    format: 'DMS',
  },
  {
    input: 'POINT(-118.3993815 34.0924496)',
    output: `34° 5' 32.8" N, 118° 23' 57.8" W`,
    format: 'DMS',
  },
];

describe('test geography formatter', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`Geography '${input}' with format ${format} should be '${output}'`, () => {
      const data = getGeographyData(input);
      const result = geographyFormatter(data, { type: 'geography', format });
      deepEqual(result, output);
    });
  }
});
