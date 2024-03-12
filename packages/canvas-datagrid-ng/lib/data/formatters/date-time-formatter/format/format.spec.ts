/// <reference types="mocha" />
import { equal } from 'assert';
import {
  getYear,
  getMonth,
  getDate,
  getWeekday,
  getHours,
  getMinutes,
  getSeconds,
  getMeridiems,
} from './index';
import { getMiliseconds } from './utils';

const testData: {
  type:
    | 'year'
    | 'month'
    | 'day'
    | 'weekday'
    | 'hours'
    | 'minutes'
    | 'seconds'
    | 'miliseconds'
    | 'meridiems';
  style: string;
  input: number;
  output: string;
}[] = [
  // year
  {
    type: 'year',
    style: '1-digit',
    input: 2011,
    output: '1',
  },
  {
    type: 'year',
    style: '2-digit',
    input: 2012,
    output: '12',
  },
  {
    type: 'year',
    style: 'full',
    input: 2013,
    output: '2013',
  },
  {
    type: 'year',
    style: '1-digit',
    input: 8,
    output: '8',
  },
  {
    type: 'year',
    style: '2-digit',
    input: 9,
    output: '09',
  },
  {
    type: 'year',
    style: 'full',
    input: 10,
    output: '0010',
  },

  // Month
  {
    type: 'month',
    style: 'numeric',
    input: 3,
    output: '4',
  },
  {
    type: 'month',
    style: 'numeric',
    input: 0,
    output: '1',
  },
  {
    type: 'month',
    style: '2-digit',
    input: 3,
    output: '04',
  },
  {
    type: 'month',
    style: '2-digit',
    input: 0,
    output: '01',
  },
  {
    type: 'month',
    style: 'short',
    input: 3,
    output: 'Apr',
  },
  {
    type: 'month',
    style: 'short',
    input: 0,
    output: 'Jan',
  },
  {
    type: 'month',
    style: 'long',
    input: 0,
    output: 'January',
  },

  // Day
  {
    type: 'day',
    style: 'numeric',
    input: 1,
    output: '1',
  },
  {
    type: 'day',
    style: '2-digit',
    input: 1,
    output: '01',
  },
  {
    type: 'day',
    style: 'numeric',
    input: 10,
    output: '10',
  },
  {
    type: 'day',
    style: '2-digit',
    input: 10,
    output: '10',
  },

  // weekday should range from 0 (Sunday) to 6 (Saturday)
  {
    type: 'weekday',
    style: 'short',
    input: 0,
    output: 'Sun',
  },
  {
    type: 'weekday',
    style: 'short',
    input: 1,
    output: 'Mon',
  },
  {
    type: 'weekday',
    style: 'short',
    input: 6,
    output: 'Sat',
  },
  {
    type: 'weekday',
    style: 'long',
    input: 2,
    output: 'Tuesday',
  },
  {
    type: 'weekday',
    style: 'long',
    input: 3,
    output: 'Wednesday',
  },
  {
    type: 'weekday',
    style: 'long',
    input: 4,
    output: 'Thursday',
  },
  {
    type: 'weekday',
    style: 'long',
    input: 5,
    output: 'Friday',
  },

  // hours
  {
    type: 'hours',
    style: 'numeric-12',
    input: 22,
    output: '10',
  },
  {
    type: 'hours',
    style: '2-digit-12',
    input: 5,
    output: '05',
  },
  {
    type: 'hours',
    style: 'numeric-24',
    input: 23,
    output: '23',
  },
  {
    type: 'hours',
    style: '2-digit-24',
    input: 9,
    output: '09',
  },

  // minutes
  {
    type: 'minutes',
    style: 'numeric',
    input: 9,
    output: '9',
  },
  {
    type: 'minutes',
    style: 'numeric',
    input: 29,
    output: '29',
  },
  {
    type: 'minutes',
    style: '2-digit',
    input: 0,
    output: '00',
  },
  {
    type: 'minutes',
    style: '2-digit',
    input: 59,
    output: '59',
  },

  // seconds
  {
    type: 'seconds',
    style: 'numeric',
    input: 2,
    output: '2',
  },
  {
    type: 'seconds',
    style: 'numeric',
    input: 12,
    output: '12',
  },
  {
    type: 'seconds',
    style: '2-digit',
    input: 1,
    output: '01',
  },
  {
    type: 'seconds',
    style: '2-digit',
    input: 30,
    output: '30',
  },

  // seconds
  {
    type: 'miliseconds',
    style: 'numeric',
    input: 2,
    output: '2',
  },
  {
    type: 'miliseconds',
    style: 'numeric',
    input: 12,
    output: '12',
  },
  {
    type: 'miliseconds',
    style: '3-digit',
    input: 3,
    output: '003',
  },
  {
    type: 'miliseconds',
    style: '3-digit',
    input: 21,
    output: '021',
  },
  {
    type: 'miliseconds',
    style: '3-digit',
    input: 211,
    output: '211',
  },

  // meridiems AM
  {
    type: 'meridiems',
    style: 'full',
    input: 0,
    output: 'AM',
  },
  {
    type: 'meridiems',
    style: 'full-lower',
    input: 3,
    output: 'am',
  },
  {
    type: 'meridiems',
    style: 'short-upper',
    input: 6,
    output: 'A',
  },
  {
    type: 'meridiems',
    style: 'short-lower',
    input: 11,
    output: 'a',
  },

  // meridiems PM
  {
    type: 'meridiems',
    style: 'full',
    input: 12,
    output: 'PM',
  },
  {
    type: 'meridiems',
    style: 'full-lower',
    input: 14,
    output: 'pm',
  },
  {
    type: 'meridiems',
    style: 'short-upper',
    input: 18,
    output: 'P',
  },
  {
    type: 'meridiems',
    style: 'short-lower',
    input: 23,
    output: 'p',
  },
];

describe('test transform date component to string', () => {
  for (let i = 0; i < testData.length; i++) {
    const data = testData[i];
    let callback: any = getYear;

    switch (data.type) {
      case 'month': {
        callback = getMonth;
        break;
      }
      case 'day': {
        callback = getDate;
        break;
      }
      case 'weekday': {
        callback = getWeekday;
        break;
      }
      case 'hours': {
        callback = getHours;
        break;
      }
      case 'minutes': {
        callback = getMinutes;
        break;
      }
      case 'seconds': {
        callback = getSeconds;
        break;
      }
      case 'miliseconds': {
        callback = getMiliseconds;
        break;
      }
      case 'meridiems': {
        callback = getMeridiems;
        break;
      }
      default: {
        callback = getYear;
        break;
      }
    }

    it(`${data.type} ${data.input} with style ${data.style} should equal ${data.output}`, () => {
      const result = callback(data.input, data.style);
      equal(result, data.output);
    });
  }
});
