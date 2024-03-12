/// <reference types="mocha" />

import { OrderInLargeData } from './large-data';
import { assertWithName } from '../../spec-util';

describe('Test OrderInLargeData', () => {
  const viewIndexSets = [
    {
      intervals: [
        [0, 10],
        [11, Infinity],
      ],
      single: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      range: {
        '[0, 1]': [[0, 0]],
        '[10, 1]': [[10, 10]],
        '[10, 2]': [[10, 11]],
        '[0, 100]': [[0, 99]],
      },
    },
    {
      intervals: [
        [11, 12],
        [0, 10],
        [13, Infinity],
      ],
      single: [11, 12, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13],
      range: {
        '[0, 1]': [[11, 11]],
        '[0, 2]': [[11, 12]],
        '[0, 3]': [
          [11, 12],
          [0, 0],
        ],
        '[3, 1]': [[1, 1]],
        '[0, 13]': [
          [11, 12],
          [0, 10],
        ],
        '[0, 100]': [
          [11, 12],
          [0, 10],
          [13, 99],
        ],
      },
    },
    {
      intervals: [
        [11, 11],
        [8, 10],
        [12, 12],
        [1, 3],
        [0, 0],
        [13, 15],
        [16, Infinity],
      ],
      single: [11, 8, 9, 10, 12, 1, 2, 3, 0, 13, 14, 15, 16, 17],
    },
  ];

  it('getRealIndex', () => {
    const order = new OrderInLargeData();
    assertWithName('getRealIndex(-1)', order.getRealIndex(-1), -1);
    assertWithName('getRealIndex(0)', order.getRealIndex(0), 0);
    assertWithName('getRealIndex(10)', order.getRealIndex(10), 10);
    assertWithName('getRealIndex(11)', order.getRealIndex(11), 11);
    for (let testIndex = 0; testIndex < viewIndexSets.length; testIndex++) {
      const { intervals, single: expect } = viewIndexSets[testIndex];
      order.intervals = intervals as any;
      assertWithName(`getRealIndex(-1)`, order.getRealIndex(-1), -1);
      expect.forEach((realIndex, viewIndex) => {
        assertWithName(
          `#${testIndex} getRealIndex(${viewIndex})`,
          order.getRealIndex(viewIndex),
          realIndex,
        );
        assertWithName(
          `#${testIndex} getViewIndex(${realIndex})`,
          order.getViewIndex(realIndex),
          viewIndex,
        );
      });
    }
  });

  it('getRealIndexes', () => {
    const order = new OrderInLargeData();
    assertWithName(`getRealIndexes(0, 0)`, order.getRealIndexes(0, 0), []);
    assertWithName(`getRealIndexes(0, 1)`, order.getRealIndexes(0, 1), [
      [0, 0],
    ]);

    for (let testIndex = 0; testIndex < viewIndexSets.length; testIndex++) {
      const { intervals, range } = viewIndexSets[testIndex];
      if (!range) continue;
      order.intervals = intervals as any;
      Object.entries(range).forEach(([_input, expect]) => {
        const input = JSON.parse(_input);
        // eslint-disable-next-line prefer-spread
        const output = order.getRealIndexes.apply(order, input);
        assertWithName(`getRealIndexes(${_input})`, output, expect);
      });
    }
  });

  it('cutSingleInterval', () => {
    // if the parameter `count` is 0, the input interval would not be cutted
    assertWithName(
      `cutSingleInterval([20, 30], 5, 0)`,
      OrderInLargeData.cutSingleInterval([20, 30], 5, 0),
      { intervals: [[20, 30]], offset: 0, count: 0 },
    );
    assertWithName(
      `cutSingleInterval([20, 30], 11, 100)`,
      OrderInLargeData.cutSingleInterval([20, 30], 11, 100),
      { intervals: [[20, 30]], offset: 0, count: 100 },
    );
    assertWithName(
      `cutSingleInterval([20, 30], 12, 100)`,
      OrderInLargeData.cutSingleInterval([20, 30], 12, 100),
      { intervals: [[20, 30]], offset: 1, count: 100 },
    );
    assertWithName(
      `cutSingleInterval([20, 30], 5, 1)`,
      OrderInLargeData.cutSingleInterval([20, 30], 5, 1),
      {
        intervals: [
          [20, 24],
          [25, 25],
          [26, 30],
        ],
        offset: 0,
        count: 0,
      },
    );
    assertWithName(
      `cutSingleInterval([20, 30], 5, 100)`,
      OrderInLargeData.cutSingleInterval([20, 30], 5, 100),
      {
        intervals: [
          [20, 24],
          [25, 30],
        ],
        offset: 0,
        count: 94,
      },
    );
    assertWithName(
      `cutSingleInterval([20, Infinity], 5, 100)`,
      OrderInLargeData.cutSingleInterval([20, Infinity], 5, 100),
      {
        intervals: [
          [20, 24],
          [25, 124],
          [125, Infinity],
        ],
        offset: 0,
        count: 0,
      },
    );
    assertWithName(
      `cutSingleInterval([20, Infinity], 5, 100)`,
      OrderInLargeData.cutSingleInterval([20, Infinity], 0, 100),
      {
        intervals: [
          [20, 119],
          [120, Infinity],
        ],
        offset: 0,
        count: 0,
      },
    );
  });

  it('getIntervalsFromIndexes', () => {
    const cases = [
      { args: [], result: [] },
      { args: [0], result: [[0, 0]] },
      {
        args: [0, 100, 1],
        result: [
          [0, 1],
          [100, 100],
        ],
      },
      {
        args: [1, 2, 3, 8, 9, 11, 15],
        result: [
          [1, 3],
          [8, 9],
          [11, 11],
          [15, 15],
        ],
      },
    ];
    cases.forEach(({ args, result }) => {
      assertWithName(
        `getIntervalsFromIndexes([${args.join(', ')}])`,
        OrderInLargeData.getIntervalsFromIndexes(args),
        result as any,
      );
    });
  });
});
