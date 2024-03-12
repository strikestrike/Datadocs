/// <reference types="mocha" />
import { equal } from 'assert';
import { formatTimeZoneOffset } from './time-zone';

const timeZoneOffsetData: Array<{
  timeZoneOffset: number;
  style: 'short' | 'narrow' | 'techie';
  output: string;
}> = [
  // narrow
  {
    timeZoneOffset: -840,
    style: 'narrow',
    output: '+14',
  },
  {
    timeZoneOffset: -420,
    style: 'narrow',
    output: '+7',
  },
  {
    timeZoneOffset: 0,
    style: 'narrow',
    output: '+0',
  },
  {
    timeZoneOffset: 390,
    style: 'narrow',
    output: '-6:30',
  },
  {
    timeZoneOffset: 500,
    style: 'narrow',
    output: '-8:20',
  },

  // short
  {
    timeZoneOffset: -700,
    style: 'short',
    output: '+11:40',
  },
  {
    timeZoneOffset: -435,
    style: 'short',
    output: '+07:15',
  },
  {
    timeZoneOffset: 0,
    style: 'short',
    output: '+00:00',
  },
  {
    timeZoneOffset: 10,
    style: 'short',
    output: '-00:10',
  },
  {
    timeZoneOffset: 105,
    style: 'short',
    output: '-01:45',
  },

  // techie
  {
    timeZoneOffset: -610,
    style: 'techie',
    output: '+1010',
  },
  {
    timeZoneOffset: -335,
    style: 'techie',
    output: '+0535',
  },
  {
    timeZoneOffset: 0,
    style: 'techie',
    output: '+0000',
  },
  {
    timeZoneOffset: 30,
    style: 'techie',
    output: '-0030',
  },
  {
    timeZoneOffset: 205,
    style: 'techie',
    output: '-0325',
  },
];

describe('test transform date component to string', () => {
  for (let i = 0; i < timeZoneOffsetData.length; i++) {
    const data = timeZoneOffsetData[i];

    it(`Time zone offset ${data.timeZoneOffset} with style ${data.style} should be ${data.output}`, () => {
      const result = formatTimeZoneOffset(data.timeZoneOffset, data.style);
      equal(result, data.output);
    });
  }
});

const timeZoneNameData = [];
