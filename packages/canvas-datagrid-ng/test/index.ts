'use strict';

// import deprecatedIntegrationTests from './integration-old/index.js';
import integrationTests from './integration/index.js';
import unitTests from './unit/index.js';

describe('canvas-datagrid', function () {
  // deprecatedIntegrationTests();
  integrationTests();
  unitTests();
});
