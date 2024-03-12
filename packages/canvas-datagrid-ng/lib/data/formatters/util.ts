import type {
  CellBooleanFormat,
  CellBytesFormat,
  CellDataFormat,
  CellDateTimeFormat,
  CellDateTypeFormat,
  CellGeographyFormat,
  CellHyperlinkFormat,
  CellIntervalFormat,
  CellJSONFormat,
  CellNumberFormat,
  CellStringFormat,
  CellStructFormat,
  CellTimeTypeFormat,
  CellTimestampTypeFormat,
} from '../../types/data-format';

export function getBooleanDefaultFormat(): CellBooleanFormat {
  return {
    type: 'boolean',
    format: 'true|false',
  };
}

export function getBytesDefaultFormat(): CellBytesFormat {
  return {
    type: 'bytes',
    format: 'utf8',
  };
}

export function getDateDefaultFormat(): CellDateTypeFormat {
  return {
    type: 'date',
    format: 'M/d/yyyy',
  };
}

export function getDatetimeDefaultFormat(): CellDateTimeFormat {
  return {
    type: 'datetime',
    format: 'M/d/yyyy hh:mm:ss AM/PM',
  };
}

export function getGeograpyDefaultFormat(): CellGeographyFormat {
  return {
    type: 'geography',
    format: 'WKT',
  };
}

export function getIntervalDefaultFormat(): CellIntervalFormat {
  return {
    type: 'interval',
    format: 'ISO_FULL',
  };
}

export function getJsonDefaultFormat(): CellJSONFormat {
  return {
    type: 'json',
    format: 'short',
  };
}

export function getNumberDefaultFormat(): CellNumberFormat {
  return {
    type: 'number',
    format: 'default',
  };
}

export function getStringDefaultFormat(): CellStringFormat {
  return {
    type: 'string',
    format: 'WithoutQuote',
  };
}

export function getStringArrayDefaultFormat(): CellStringFormat {
  return {
    type: 'string',
    format: 'DoubleQuote',
  };
}

export function getStructDefaultFormat(): CellStructFormat {
  return {
    type: 'struct',
    format: 'raw',
  };
}

export function getTimeDefaultFormat(): CellTimeTypeFormat {
  return {
    type: 'time',
    format: 'h:mm:ss AM/PM',
  };
}

export function getTimestampDefaultFormat(): CellTimestampTypeFormat {
  return {
    type: 'timestamp',
    format: 'M/d/yyyy hh:mm:ss AM/PM UTCZZ',
  };
}

export function getDefaultDataFormat(type: string) {
  switch (type) {
    case 'boolean':
    case 'boolean[]': {
      return getBooleanDefaultFormat();
    }
    case 'bytes':
    case 'bytes[]': {
      return getBytesDefaultFormat();
    }
    case 'date':
    case 'date[]': {
      return getDateDefaultFormat();
    }
    case 'datetime':
    case 'datetime[]': {
      return getDatetimeDefaultFormat();
    }
    case 'geography':
    case 'geography[]': {
      return getGeograpyDefaultFormat();
    }
    case 'interval':
    case 'interval[]': {
      return getIntervalDefaultFormat();
    }
    case 'json':
    case 'json[]': {
      return getJsonDefaultFormat();
    }
    case 'number':
    case 'number[]':
    case 'int':
    case 'int[]':
    case 'float':
    case 'float[]':
    case 'decimal':
    case 'decimal[]': {
      return getNumberDefaultFormat();
    }
    case 'string': {
      return getStringDefaultFormat();
    }
    case 'string[]': {
      return getStringArrayDefaultFormat();
    }
    case 'struct':
    case 'struct[]': {
      return getStructDefaultFormat();
    }
    case 'time':
    case 'time[]': {
      return getTimeDefaultFormat();
    }
    case 'timestamp':
    case 'timestamp[]': {
      return getTimestampDefaultFormat();
    }
    default:
      break;
  }
}

export function isHyperlinkDataFormat(
  format: CellDataFormat,
): format is CellHyperlinkFormat {
  return format?.type === 'string' && format?.format === 'Hyperlink';
}
