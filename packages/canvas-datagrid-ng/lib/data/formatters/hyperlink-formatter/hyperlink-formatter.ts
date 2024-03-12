import type { DataFormatWithHyperlinkResult } from '../../../types';
import { getImplicitHyperlinkRuns } from '../../../utils/hyperlink';

export function hyperlinkFormatter(
  value: string,
): string | DataFormatWithHyperlinkResult {
  const linkRuns = getImplicitHyperlinkRuns(value);

  if (linkRuns?.length > 0) {
    return {
      type: 'hyperlink',
      value: value,
      linkRuns,
    };
  }

  return value;
}
