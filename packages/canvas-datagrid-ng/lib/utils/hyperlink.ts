import type {
  HyperlinkData,
  MetaRun,
  NormalCellDescriptor,
  TableVariantCellData,
} from '../types';
import { getMD5Hash } from './hash';

const urlRegex =
  /(https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{1,6}\b(((\.[-a-zA-Z0-9@:%_+~#?&/=]+)|[-a-zA-Z0-9@:%_+~#?&/=])*)?/gi;

/**
 * Get valid URL
 * @param value
 * @returns
 */
export function getValidHyperlink(value: string) {
  const match = value.match(urlRegex);
  if (
    match?.[0] === value &&
    (isValidHttpURL(value) ||
      (!value.startsWith('http') && isValidHttpURL('http://' + value)))
  ) {
    return value;
  }

  return null;
}

/**
 * Check if a string is a valid hyperlink or not
 */
export function isValidHyperlink(value: string) {
  return typeof value === 'string' && !!getValidHyperlink(value);
}

/**
 * Check if a url string is valid http URL
 * @param value
 * @returns
 */
export function isValidHttpURL(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

export function transformToHttpUrl(value: string) {
  if (!value.startsWith('http') && isValidHttpURL('http://' + value)) {
    return 'http://' + value;
  }

  return value;
}

/**
 * Get implicit hyperlink run from a string value
 * @param value
 * @returns
 */
export function getImplicitHyperlinkRuns(value: string): MetaRun[] {
  if (!value) return null;

  const matches = Array.from(value.matchAll(urlRegex));
  const linkRuns: MetaRun[] = [];

  for (const match of matches) {
    const v = match[0];
    linkRuns.push({
      startOffset: match.index,
      endOffset: match.index + v.length,
      ref: v,
    });
  }

  return linkRuns.length > 0 ? linkRuns : null;
}

/**
 * Get the display text and link-runs by combining original text with its
 * link runs. It can also be used to compute effective text for table cells
 * as well.
 * @param value
 * @param linkRuns
 * @returns
 */
export function getLinkDisplayContent<T extends MetaRun>(
  value: string,
  linkRuns: T[],
) {
  const displayLinkRuns: T[] = [];
  let displayText = value;

  function getResult() {
    return { displayText, displayLinkRuns };
  }

  // If there is no value or no linkRuns, the effective text is the same as
  // original value
  if (!value || !linkRuns || linkRuns.length === 0) {
    return getResult();
  }

  let currentOffset = 0;
  displayText = '';

  for (const run of linkRuns) {
    if (checkValidLinkRun(run)) {
      if (currentOffset < run.startOffset) {
        displayText += value.slice(currentOffset, run.startOffset);
        currentOffset = displayText.length;
      }

      displayText += run.label ? run.label : run.ref;
      // Only change the startOffset and endOffset of the run according to
      // its text offset inside effective text
      displayLinkRuns.push({
        ...run,
        startOffset: currentOffset,
        endOffset: displayText.length,
      });
      currentOffset = run.endOffset;
    }
  }

  // Add in the rest of the text
  displayText += value.slice(currentOffset);
  return getResult();
}

function checkValidLinkRun<T extends MetaRun>(linkRun: T) {
  return (
    linkRun.startOffset < linkRun.endOffset && (linkRun.label || linkRun.ref)
  );
}

/**
 * Get string value from Table cells. The value can be a STRING in string column
 * or a {@link TableVariantCellData} in VARIANT column
 */
export function getTableCellStringValue(value: string | TableVariantCellData) {
  if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'object' && value?.dataType === 'string') {
    return value.value;
  }
}

/**
 * Get hyperlink data of a cell. If the cell value is readonly, added additional
 * effectiveText and originalTextHash.
 * @param linkRuns
 * @param originalValue
 * @param isReadOnly
 * @returns
 */
export function getHyperlinkData(
  linkRuns: MetaRun[],
  originalValue: string,
  isReadOnly: boolean,
): HyperlinkData {
  // Only need to add effectiveText and originalTextHash if the cell value is
  // readonly and there are link runs in the cell.
  const needEffectiveText = isReadOnly && linkRuns?.length > 0;

  return {
    effectiveText: needEffectiveText
      ? getLinkDisplayContent(originalValue, linkRuns).displayText
      : null,
    originalTextHash: needEffectiveText ? getMD5Hash(originalValue) : null,
    spans: linkRuns,
  };
}

/**
 * Check if a hyperlink data is still valid
 * @param linkData
 * @param value
 * @param isReadOnly
 * @returns
 */
export function isHyperlinkDataValid(
  linkData: HyperlinkData,
  value: string,
  isReadOnly: boolean,
) {
  if (!isReadOnly || linkData?.effectiveText == null) {
    return true;
  }

  return linkData.originalTextHash === getMD5Hash(value);
}

/**
 * Check whether a cell is formula or not
 * @param cell
 * @returns
 */
export function isFormulaCell(cell: NormalCellDescriptor) {
  return (
    typeof cell.value === 'string' &&
    cell.value.startsWith('=') &&
    cell.meta.parserData
  );
}

/**
 * Get link-runs from a formula cell
 * @param cell
 * @returns
 */
export function getFormulaCellLinkRuns(cell: NormalCellDescriptor): MetaRun[] {
  if (isFormulaCell(cell) && isValidHyperlink(cell.formattedValue)) {
    return [
      {
        startOffset: 0,
        endOffset: cell.formattedValue.length,
        ref: cell.formattedValue,
      },
    ];
  }

  return null;
}
