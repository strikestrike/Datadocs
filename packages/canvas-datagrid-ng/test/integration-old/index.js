'use strict';

import { cleanup, mouseup, click } from './util.js';

import instantationTests from './instantation.js';
import drawingTests from './drawing.js';
import styleTests from './style.js';
import rangeTests from './range.js';
import dataInterfaceTests from './data-interface.js';
import touchTests from './touch.js';
import editingTests from './editing.js';
import keyNavigationTests from './key-navigation.js';
import moveTests from './move.js';
import resizeTests from './resize.js';
import formattersTests from './formatters.js';
import sortersTests from './sorters.js';
import selectionsTests from './selections.js';
import filtersTests from './filters.js';
import attributesTests from './attributes.js';
import groupsTests from './groups.js';
import reorderColumnsTests from './reorder-columns.js';
import publicInterfaceTests from './public-interface.js';
import contextMenuTests from './context-menu.js';
import webComponentTests from './web-component.js';
import scrollingTests from './scrolling.js';
import unhideIndicatorTests from './unhide-indicator.js';
import wrappingModeTests from './wrapping-mode-tests.js';
import dataSourceTests from './data-source.js';

export default function () {
  after(function (done) {
    // git rid of lingering artifacts from the run
    mouseup(document.body, 1, 1);
    mouseup(document.body, 1, 1);
    click(document.body, 1, 1);
    done();
  });
  beforeEach(cleanup);
  afterEach(cleanup);

  describe('Integration Tests', function () {
    describe('Instantiation', instantationTests);
    describe('Web component', webComponentTests);
    describe('Drawing', drawingTests);
    describe('Styles', styleTests);
    describe('Range interface', rangeTests);
    describe('Data interface', dataInterfaceTests);
    describe('Data source', dataSourceTests);
    describe('Public interface', publicInterfaceTests);
    describe('Context menu', contextMenuTests);
    describe('Scroll box with scrollPointerLock false', scrollingTests);
    describe('Touch', touchTests);
    describe('Editing', editingTests);
    describe('Key navigation', keyNavigationTests);
    describe('Move', moveTests);
    describe('Resize', resizeTests);
    describe('Formatters', formattersTests);
    describe('Sorters', sortersTests);
    describe('Selections', selectionsTests);
    describe('Filters', filtersTests);
    describe('Attributes', attributesTests);
    describe('Groups', groupsTests);
    describe('Unhide indicator', unhideIndicatorTests);
    describe('Reorder columns', reorderColumnsTests);
    /**
     * The reason why we skip the following tests is:
     * these tests are inconsistent between browser and headless browser.
     * they can cause errors
     */
    describe.skip('Wrapping mode', wrappingModeTests);
  });
}
