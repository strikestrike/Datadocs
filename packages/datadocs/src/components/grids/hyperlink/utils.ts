/**
 * Calculate selected areas of text inside an HTMLElement. The return value
 * should be multiple rects because the text can span on multiple lines.
 * @param node
 * @param startOffset
 * @param endOffset
 * @returns
 */
export function calculateTextOverlayRects(
  node: HTMLElement,
  startOffset: number,
  endOffset: number
) {
  const range = document.createRange();
  const charList: Array<{ element: ChildNode; offset: number }> = [];
  const childNodes = node.childNodes;

  let currentOffset = 0;
  for (let i = 0; i < childNodes.length; i++) {
    const childNode =
      childNodes[i] instanceof Text
        ? childNodes[i]
        : childNodes[i].childNodes[0];

    if (!childNode) {
      continue;
    }

    const textLength = childNode.textContent.length;
    const start = Math.max(startOffset, currentOffset);
    const end = Math.min(endOffset, currentOffset + textLength);

    if (start < end) {
      for (let j = start; j < end; j++) {
        charList.push({
          element: childNode,
          offset: j - currentOffset,
        });
      }
    }

    currentOffset += textLength;
    if (currentOffset > endOffset) {
      break;
    }
  }

  const childList: DOMRect[] = [];
  for (const char of charList) {
    range.setStart(char.element, char.offset);
    range.setEnd(char.element, char.offset + 1);
    childList.push(range.getBoundingClientRect());
  }

  if (childList.length === 0) {
    return null;
  }

  function isOnSameLine(a: DOMRect, b: DOMRect) {
    if (a.top >= b.bottom || a.bottom <= b.top) {
      return false;
    }

    const aHeight = a.bottom - a.top;
    const bHeight = b.bottom - b.top;
    const insertsectionHeight =
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    // Two child rects overllap over 90% are considered located in the same line
    const overlapRate = 0.9;

    return (
      insertsectionHeight / aHeight >= overlapRate ||
      insertsectionHeight / bHeight >= overlapRate
    );
  }

  // Separate childList into multiple lines in order to calculate selected text
  // layover for each line separately
  const lines: Array<DOMRect[]> = [];
  let currentLine: DOMRect[] = [];

  lines.push(currentLine);
  for (const child of childList) {
    if (currentLine.length === 0) {
      currentLine.push(child);
    } else {
      if (isOnSameLine(currentLine[0], child)) {
        currentLine.push(child);
      } else {
        currentLine = [child];
        lines.push(currentLine);
      }
    }
  }

  return lines.map((line) => {
    return {
      left: Math.min(...line.map((child) => child.left)),
      right: Math.max(...line.map((child) => child.right)),
      top: Math.min(...line.map((child) => child.top)),
      bottom: Math.max(...line.map((child) => child.bottom)),
    };
  });
}
