import { contextmenu, g, smallData, assertIf } from './util.js';

export default function () {
  let incr = 0;
  const menuId = {
    hideCol1: incr++,
    zooming: incr++,
    saveRange: incr++,
    loadRange: incr++,
    orderByCol1Assending: incr++,
    orderByCol1Decending: incr++,
    childMenu: incr++,
  };
  // it('Should produce a context menu', function (done) {
  //   var grid = g({
  //     test: this.test,
  //     data: smallData(),
  //   });
  //   grid.addEventListener('contextmenu', function (e) {
  //     setTimeout(function () {
  //       done(
  //         assertIf(
  //           !document.body.contains(e.items[menuId.hideCol1]),
  //           'Expected context menu to exist in the body and be visible.',
  //         ),
  //       );
  //     }, 1);
  //   });
  //   contextmenu(grid.canvas, 60, 37);
  // });
  it('Clicking Order by asc should order the selected column asc', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    grid.addEventListener('contextmenu', function (e) {
      setTimeout(function () {
        e.items[menuId.orderByCol1Assending].contextItemContainer.dispatchEvent(
          new Event('click'),
        );
        done(
          assertIf(
            grid.viewData[0].col1 !== 'bar',
            'Expected the content to be reordered asc.',
          ),
        );
      }, 1);
    });
    contextmenu(grid.canvas, 100, 37);
  });
  it('Should produce a context menu very wide requiring the context menu move to be fully visible', function (done) {
    var d = [],
      x,
      grid = g({
        test: this.test,
        data: smallData(),
      });
    for (x = 0; x < 100; x += 1) {
      d.push({
        title:
          'veryveryveryveryveryveryveryveryveryveryveryveryveryveryveryveryveryverywide',
      });
    }
    grid.addEventListener('contextmenu', function (e) {
      e.items.push({
        title: 'Child menu',
        items: function () {
          return d;
        },
      });
      setTimeout(function () {
        e.items[menuId.childMenu].contextItemContainer.dispatchEvent(
          new Event('mouseover'),
        );
        setTimeout(function () {
          done(
            assertIf(
              !e.items[menuId.childMenu].contextMenu.container,
              'Expected child context menu.',
            ),
          );
        }, 1);
      }, 1);
    });
    contextmenu(grid.canvas, 60, 37);
  });
  it('Should create a child context menu using a function that returns items', function (done) {
    var d = [],
      x,
      grid = g({
        test: this.test,
        data: smallData(),
      });
    for (x = 0; x < 100; x += 1) {
      d.push({
        title: x,
      });
    }
    grid.addEventListener('contextmenu', function (e) {
      e.items.push({
        title: 'Child menu',
        items: function () {
          return d;
        },
      });
      setTimeout(function () {
        e.items[menuId.childMenu].contextItemContainer.dispatchEvent(
          new Event('mouseover'),
        );
        setTimeout(function () {
          done(
            assertIf(
              !e.items[menuId.childMenu].contextMenu.container,
              'Expected child context menu.',
            ),
          );
        }, 1);
      }, 1);
    });
    contextmenu(grid.canvas, 60, 37);
  });
  it('Should create a child context menu using a function that uses a callback argument', function (done) {
    var d = [],
      x,
      grid = g({
        test: this.test,
        data: smallData(),
      });
    for (x = 0; x < 100; x += 1) {
      d.push({
        title: x,
      });
    }
    grid.addEventListener('contextmenu', function (e) {
      e.items.push({
        title: 'Child menu',
        items: function (callback) {
          return callback(d);
        },
      });
      setTimeout(function () {
        e.items[menuId.childMenu].contextItemContainer.dispatchEvent(
          new Event('mouseover'),
        );
        setTimeout(function () {
          done(
            assertIf(
              !e.items[menuId.childMenu].contextMenu.container,
              'Expected child context menu.',
            ),
          );
        }, 1);
      }, 1);
    });
    contextmenu(grid.canvas, 60, 37);
  });
  it.skip('Create a child context menu and scroll up and down using mouseover events, then exit menu', function (done) {
    var d = [],
      x,
      grid = g({
        test: this.test,
        data: smallData(),
      });
    for (x = 0; x < 100; x += 1) {
      d.push({
        title: x,
      });
    }
    grid.addEventListener('contextmenu', function (e) {
      e.items.push({
        title: 'Child menu',
        items: d,
      });
      setTimeout(function () {
        e.items[menuId.childMenu].contextItemContainer.dispatchEvent(
          new Event('mouseover'),
        );
        e.items[menuId.childMenu].contextMenu.downArrow.dispatchEvent(
          new Event('mouseover'),
        );
        setTimeout(function () {
          var err = assertIf(
            e.items[menuId.childMenu].contextMenu.container.scrollTop === 0,
          );
          if (err) {
            return done(err);
          }
          e.items[menuId.childMenu].contextMenu.downArrow.dispatchEvent(
            new Event('mouseout'),
          );
          e.items[menuId.childMenu].contextMenu.upArrow.dispatchEvent(
            new Event('mouseover'),
          );
          setTimeout(function () {
            e.items[menuId.childMenu].contextMenu.upArrow.dispatchEvent(
              new Event('mouseout'),
            );
            err = assertIf(
              e.items[menuId.childMenu].contextMenu.container.scrollTop !== 0,
            );
            if (err) {
              return done(err);
            }
            setTimeout(function () {
              e.items[menuId.childMenu].contextItemContainer.dispatchEvent(
                new Event('mouseout'),
              );
              done(
                assertIf(
                  e.items[menuId.childMenu].contextMenu !== undefined,
                  'expected child context menu to be gone.',
                ),
              );
            }, 100);
          }, 1500);
        }, 1000);
      }, 1);
    });
    contextmenu(grid.canvas, 60, 37);
  });
}
