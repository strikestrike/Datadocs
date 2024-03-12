import type { CellBytesFormat } from '../../../types/data-format';
import { stringFormatter } from '../string-formatter';
import { getBytesDefaultFormat } from '../util';

const DEFAULT_BYTES_FORMAT = getBytesDefaultFormat().format;

export function bytesFormatter(
  data: Uint8Array,
  limit = 36,
  dataFormat?: CellBytesFormat,
) {
  const value = data instanceof Uint8Array ? data : new Uint8Array(data);
  const format = dataFormat?.format ?? DEFAULT_BYTES_FORMAT;
  let result = '';

  switch (format) {
    case 'base64': {
      result = bytesToBase64(value);
      break;
    }
    case 'hex': {
      result = bytesToHex(value);
      break;
    }
    case 'utf8': {
      result = bytesToUtf8(value);
      break;
    }
    default: {
      result = bytesToUtf8(value);
      break;
    }
  }

  return stringFormatter(result, limit, {
    type: 'string',
    format: 'WithoutQuote',
  });
}

function bytesToBase64(value: Uint8Array) {
  let data = '';
  const maxArgs = 0x1000;
  const strs: string[] = [];
  for (let i = 0; i < value.length; i += maxArgs) {
    strs.push(String.fromCharCode.apply(null, value.subarray(i, i + maxArgs)));
  }
  data = strs.join('');
  return btoa(data);
}

const hexMap = '0123456789abcdef';
function bytesToHex(value: Uint8Array) {
  let result = '';

  for (let i = 0; i < value.length; i++) {
    const a = (value[i] & 0xf0) >> 4;
    const b = value[i] & 0x0f;
    result += hexMap[a] + hexMap[b];
  }

  return result;

  // for (let i = 0; i < value.length; i++) {
  //   result += value[i].toString(16).padStart(2, '0');
  // }
}

const decoder = new TextDecoder();
function bytesToUtf8(value: Uint8Array) {
  return decoder.decode(value);
}
