export type ParsedCSV = {
  rows: string[][];
  lastRow: string;
};

export function parseCSV(csv: string) {
  const rows = [];
  const size = csv.length;

  let columns = [];
  let inQuote = false;
  let ignoreText = false;
  let newCell = true;
  let cellValue = '';
  let lastBegin = 0;

  let ptr = 0;
  const onNewRow = () => {
    if (ptr > lastBegin) {
      columns.push(cellValue);
      rows.push(columns);
    }
    columns = [];
    newCell = true;
    lastBegin = ptr + 1;
  };
  for (; ptr < size; ptr++) {
    const ch = csv[ptr];
    if (newCell) {
      ignoreText = false;
      inQuote = false;
      newCell = false;
      cellValue = '';

      switch (ch) {
        case '"':
          inQuote = true;
          break;
        // empty cell
        case ',':
          columns.push('');
          newCell = true;
          break;
        case '\n':
          onNewRow();
          break;
        default:
          cellValue = ch;
      }
      continue;
    }
    // end of newCell
    if (inQuote) {
      if (ch === '"') {
        const ch2 = csv[ptr + 1];
        if (ch2 === '"') {
          cellValue += ch;
          ptr++;
        } else {
          inQuote = false;
          ignoreText = true;
        }
      } else {
        cellValue += ch;
      }
      continue;
    }
    if (ch === '\n') {
      onNewRow();
      continue;
    }
    if (ch === ',') {
      columns.push(cellValue);
      newCell = true;
      continue;
    }
    if (!ignoreText) cellValue += ch;
  }
  // end of `for` loop

  if (lastBegin < size) {
    if (!newCell) columns.push(cellValue);
    rows.push(columns);
  }
  return { rows, lastRow: csv.slice(lastBegin) };
}
