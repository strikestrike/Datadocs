import { htmlEscape } from '../utils/string';
import { isOnlyOneCellInTheMatrix } from './utils';

type DataType = {
  str: string;
  rowSpan?: number;
  colSpan?: number;
};

export function stringifyDataForClipboard(data: DataType[][]) {
  const tsv: string[] = [];
  const html: string[] = [];
  const getResult = () => ({ tsv: tsv.join(''), html: html.join('') });
  if (!data.length) return getResult();

  const firstCell = data[0][0];
  if (!firstCell) return getResult();

  html.push("<meta charset='utf-8'>");
  html.push('<meta name=ProgId content=Datadocs>');
  const isOnlyOneCell = isOnlyOneCellInTheMatrix(data);

  if (isOnlyOneCell) {
    if (
      (!Number.isInteger(firstCell.rowSpan) || firstCell.rowSpan <= 0) &&
      (!Number.isInteger(firstCell.colSpan) || firstCell.colSpan <= 0)
    ) {
      tsv.push(firstCell.str);
      html.push(`<span>${htmlEscape(firstCell.str)}</span>`);
      return getResult();
    }
  }

  html.push(`<table>`);
  for (let yOffset = 0; yOffset < data.length; yOffset++) {
    const cells = data[yOffset];
    let tsvRow = yOffset > 0 ? '\n' : '';
    let htmlRow = yOffset > 0 ? '\n<tr>' : '<tr>';
    for (let xOffset = 0; xOffset < cells.length; xOffset++) {
      const cell = cells[xOffset];
      if (xOffset > 0) tsvRow += '\t';
      if (!cell) continue;
      if (cell.str) tsvRow += cell.str;
      htmlRow +=
        `<td` +
        (cell.rowSpan ? ` rowspan=${cell.rowSpan}` : '') +
        (cell.colSpan ? ` colspan=${cell.colSpan}` : '') +
        `>${htmlEscape(cell.str || '')}</td>`;
    }
    htmlRow += '</tr>';
    tsv.push(tsvRow);
    html.push(htmlRow);
  }

  html.push(`</table>`);
  return getResult();
}
