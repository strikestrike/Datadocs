'use strict';

import instantationTests from './instantation.js';
import datasourceTests from './data-source.js';

export default function () {
  describe('Integration Tests', function () {
    describe('Instantiation', instantationTests);
    describe('DataSource', datasourceTests);
  });
}
