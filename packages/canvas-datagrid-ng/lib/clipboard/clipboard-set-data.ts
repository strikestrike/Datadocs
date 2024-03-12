import type { MinimumNativeClipboardData } from './spec';

export async function setDataToClipboard(
  dataMap: { [mimeType: string]: string | Blob },
  clipboardData?: MinimumNativeClipboardData | null,
) {
  if (clipboardData) {
    let switchToClipboardApi = false;

    const mimeTypes = Object.keys(dataMap);
    for (let i = 0; i < mimeTypes.length; i++) {
      const mimeType = mimeTypes[i];
      const data = dataMap[mimeType];
      if (typeof data === 'string') {
        delete dataMap[mimeType];
        clipboardData.setData(mimeType, data);
      } else {
        if (!data) continue;
        switchToClipboardApi = true;
        break;
      }
    }
    if (!switchToClipboardApi) return;
  }

  const data = [new ClipboardItem(dataMap)];
  return navigator.clipboard.write(data);
}
