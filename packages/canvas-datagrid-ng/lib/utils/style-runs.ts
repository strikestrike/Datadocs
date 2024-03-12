import type { CellStyleDeclaration, StyleRun, TextRange } from '../types';

/**
 * Merge two style run together, target style run value will have
 * higher priority
 * @param target
 * @param source
 * @returns
 */
export const mergeStyleRuns = (
  target: StyleRun[],
  source: StyleRun[],
): StyleRun[] => {
  function assignStyle(
    t: Partial<CellStyleDeclaration>,
    s: Partial<CellStyleDeclaration>,
  ) {
    const style = t ? { ...t } : {};
    if (s) {
      for (const key in s) {
        if (style[key] == null) {
          style[key] = s[key];
        }
      }
    }
    return style;
  }

  if (!source || source.length === 0) {
    // There is no source style-runs, return target
    return target ?? [];
  } else if (!target || target.length === 0) {
    // There is no target style-runs, return source
    return source ?? [];
  } else {
    // Do merging
    const styleRuns: StyleRun[] = [];
    let targetIndex = 0;
    let sourceIndex = 0;
    let remainSourceRun = { ...source[sourceIndex] };
    let remainTargetRun = { ...target[targetIndex] };

    while (remainTargetRun || remainSourceRun) {
      const intersection = getTextRangeIntersection(
        remainTargetRun,
        remainSourceRun,
      );

      if (intersection) {
        if (remainTargetRun.startOffset < intersection.startOffset) {
          // Add part of target run before intersection as a new run
          styleRuns.push({
            startOffset: remainTargetRun.startOffset,
            endOffset: intersection.startOffset,
            style: remainTargetRun.style,
          });
        }
        if (remainSourceRun.startOffset < intersection.startOffset) {
          // Add part of source run before intersection as a new run
          styleRuns.push({
            startOffset: remainSourceRun.startOffset,
            endOffset: intersection.startOffset,
            style: remainSourceRun.style,
          });
        }

        styleRuns.push({
          startOffset: intersection.startOffset,
          endOffset: intersection.endOffset,
          style: assignStyle(remainTargetRun.style, remainSourceRun.style),
        });

        if (remainTargetRun.endOffset > remainSourceRun.endOffset) {
          // The whole remain source run has been checked, can process with the
          // next source run
          sourceIndex += 1;
          remainSourceRun = source[sourceIndex]
            ? { ...source[sourceIndex] }
            : null;
          remainTargetRun.startOffset = intersection.endOffset;
        } else if (remainTargetRun.endOffset < remainSourceRun.endOffset) {
          // The whole target source run has been checked, can process with the
          // next target run
          targetIndex += 1;
          remainTargetRun = target[targetIndex]
            ? { ...target[targetIndex] }
            : null;
          remainSourceRun.startOffset = intersection.endOffset;
        } else {
          // Target and source run have the same endOffset, there is no remaining part
          // that wasn't processed, move to next ones
          targetIndex += 1;
          sourceIndex += 1;
          remainSourceRun = source[sourceIndex]
            ? { ...source[sourceIndex] }
            : null;
          remainTargetRun = target[targetIndex]
            ? { ...target[targetIndex] }
            : null;
        }
      } else {
        if (
          !remainTargetRun ||
          (remainSourceRun &&
            remainSourceRun.endOffset <= remainTargetRun.startOffset)
        ) {
          // There is no target runs left OR it's safe to add the whole remain source
          // run because there will be no overlap with other target run
          styleRuns.push({
            startOffset: remainSourceRun.startOffset,
            endOffset: remainSourceRun.endOffset,
            style: remainSourceRun.style,
          });
          sourceIndex += 1;
          remainSourceRun = source[sourceIndex]
            ? { ...source[sourceIndex] }
            : null;
        } else if (
          !remainSourceRun ||
          (remainTargetRun &&
            remainTargetRun.endOffset <= remainSourceRun.startOffset)
        ) {
          // There is no source runs left OR it's safe to add the whole remain target
          // run because there will be no overlap with other source run
          styleRuns.push({
            startOffset: remainTargetRun.startOffset,
            endOffset: remainTargetRun.endOffset,
            style: remainTargetRun.style,
          });
          targetIndex += 1;
          remainTargetRun = target[targetIndex]
            ? { ...target[targetIndex] }
            : null;
        } else {
          break;
        }
      }
    }

    return styleRuns;
  }
};

/**
 * Get text range intersection or return null if not found
 * @param r1
 * @param r2
 * @returns
 */
export function getTextRangeIntersection(r1: TextRange, r2: TextRange) {
  if (
    !r1 ||
    !r2 ||
    r1.endOffset <= r2.startOffset ||
    r1.startOffset >= r2.endOffset
  ) {
    return null;
  }

  return {
    startOffset: Math.max(r1.startOffset, r2.startOffset),
    endOffset: Math.min(r1.endOffset, r2.endOffset),
  };
}
