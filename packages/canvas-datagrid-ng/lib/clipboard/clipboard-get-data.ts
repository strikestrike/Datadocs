import type { MinimumNativeClipboardData } from './spec';

/**
 * Clipboard inspector:
 * @see https://evercoder.github.io/clipboard-inspector/
 */
export async function getDataFromClipboard(
  clipboardData?: MinimumNativeClipboardData | null,
  mimeTypesOrder = ['text/html', 'text/csv', 'text/plain'],
): Promise<{
  mimeType: string;
  text: string;
} | null> {
  if (clipboardData?.items) {
    const items = new Map(
      Array.from(clipboardData.items).map((item) => [item.type, item]),
    );

    // The clipboard will often contain the same data in multiple formats,
    // which can be used depending on the context in which it's pasted. Here
    // we'll prefere more structured (HTML/CSV) over less structured, when
    // available, so we try to find those first:
    let item: DataTransferItem;
    for (let i = 0; i < mimeTypesOrder.length; i++) {
      const mimeType = mimeTypesOrder[i];
      item = items.get(mimeType);
      if (!item) continue;
      break;
    }

    if (!item) {
      console.warn(
        'Cannot find supported clipboard data type. Supported types are:',
        mimeTypesOrder.join(', '),
      );
      return null;
    }

    const mimeType = item.type;
    return new Promise((resolve) => {
      item.getAsString((text) => {
        resolve({ mimeType, text });
      });
    });
  }

  const clipboardContents = await navigator.clipboard.read();
  let mimeType: string;
  let blob: Blob;
  for (const item of clipboardContents) {
    for (let i = 0; i < mimeTypesOrder.length; i++) {
      mimeType = mimeTypesOrder[i];
      if (item.types.includes(mimeType)) {
        blob = await item.getType(mimeType);
        break;
      }
    }
    if (blob) break;
  }
  if (!blob) return null;

  const text = await blob.text();
  return {
    mimeType,
    text,
  };
}
