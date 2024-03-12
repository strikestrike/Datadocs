'use strict';

import BTree from 'sorted-btree';
import type { GridPrivateProperties } from '../types';
import type { GroupData, GroupDescriptor } from './types';

/** Add grouping */
const addGroup = (
  self: GridPrivateProperties,
  groupFor: 'columns' | 'rows',
  from: number,
  to: number,
) => {
  if (
    addGroupInternal(
      groupFor === 'rows' ? self.groupedRows : self.groupedColumns,
      from,
      to,
    )
  ) {
    if (from === 0) {
      if (groupFor === 'columns') {
        self.isColumnGroupToggleButtonMovedToEnd = true;
      } else {
        self.isRowGroupToggleButtonMovedToEnd = true;
      }
    }
    self.refresh();
  }
};

/**
 * Create a new group in the given group data.
 *
 * This fully replicates the Sheets behavior.
 * @param allGroups To create group in.
 * @param beginIndex The start index of the new group.
 * @param endIndex The end index of the new group.
 * @returns True if the creation was successful, or false if {@link beginIndex},
 *  was 0, or there is already a group with the same indexes in one of the
 *  levels.
 */
const addGroupInternal = (
  allGroups: GroupData[],
  beginIndex: number,
  endIndex: number,
): boolean => {
  const createLevel = (): GroupData => {
    const groups = new BTree();
    allGroups.push(groups);
    return groups;
  };
  const consume = (data: GroupData, map: [number, number][]) => {
    for (const [from, to] of map) {
      data.deleteRange(from, to, true);
      data.set(from, { to, collapsed: false }, true);
    }
  };
  type GroupPair = [number, number];

  // If there is no previous group data, create an empty level.
  if (allGroups.length <= 0) {
    createLevel();
  }

  let currentMap = [[beginIndex, endIndex]];
  let creationMap = [] as GroupPair[];

  for (let i = 0; i < allGroups.length; i++) {
    const groups = allGroups[i];
    const prevStart = groups.getPairOrNextLower(Math.max(beginIndex - 1, 0));
    const lastLevel = i === allGroups.length - 1;

    let nextMap = [] as GroupPair[];

    for (let [from, to] of currentMap) {
      const entries = groups.entries(prevStart?.[0] ?? from);

      let hadBlocker = false;
      for (const pair of entries) {
        const [groupFrom, descriptor] = pair;
        if (from - 1 > descriptor.to) continue;
        if (to + 1 < groupFrom) break;

        // This is the only case where we are disallowing the creation because
        // there is already a group for the requested indexes.
        if (groupFrom === from && descriptor.to === to) {
          return false;
        }

        if (groupFrom <= from && descriptor.to >= to) {
          nextMap.push([from, to]);
          hadBlocker = true;
          break;
        } else if (
          (groupFrom <= from && descriptor.to >= from) !==
          (groupFrom <= to && descriptor.to >= to)
        ) {
          nextMap.push([
            Math.max(from, groupFrom),
            Math.min(to, descriptor.to),
          ]);
          from = Math.min(groupFrom, from);
          to = Math.max(to, descriptor.to);
        } else if (from - 1 === descriptor.to || to + 1 === groupFrom) {
          from = Math.min(groupFrom, from);
          to = Math.max(to, descriptor.to);
        }
      }

      if (!hadBlocker) creationMap.push([from, to]);

      if (creationMap.length > 0) {
        consume(groups, creationMap);
        creationMap = [];
      }
    }

    if (lastLevel) {
      creationMap = nextMap;
    } else {
      currentMap = nextMap;
      nextMap = [];
    }
  }

  if (creationMap && creationMap.length > 0) {
    consume(createLevel(), creationMap);
  }

  return true;
};

/**
 * Remove grouping
 */
const removeGroup = (
  self: GridPrivateProperties,
  allGroups: GroupData[],
  from: number,
  to: number,
) => {
  for (let i = 0; i < allGroups.length; i++) {
    const groups = allGroups[i];
    const group = groups.get(from);
    if (group && group.to === to) {
      groups.delete(from);
      if (groups.size === 0) allGroups.splice(i, 1);
      self.refresh();
      return;
    }
  }
};

const reorderGroups = (
  groupsArray: GroupData[],
  startIndex: number,
  endIndex: number,
  afterViewIndex: number,
) => {
  const total = 1 + (endIndex ?? startIndex) - startIndex;
  if (total < 1 || afterViewIndex === startIndex) return false;

  const movingGroups = [] as Map<number, GroupDescriptor>[];
  endIndex = endIndex ?? startIndex;

  // Collect the reordered range early, and store it to reapply later.  We
  // just use this data to recreate groups, so we don't actually separate
  // groups unless the range fully covers them.  If we are starting from the
  // middle of a group, we don't touch it since we will be shrinking it in the
  // next section.
  for (let i = 0; i < groupsArray.length; i++) {
    const groups = groupsArray[i];
    const realStartIndex =
      groups.getPairOrNextLower(startIndex)?.[0] ?? startIndex;
    const map = new Map();
    movingGroups[i] = map;

    groups.getRange(realStartIndex, endIndex, true).forEach((pair, _, __) => {
      const [from, group] = pair;
      if (group.to < startIndex) return;

      const copyGroup = { ...group };
      copyGroup.to = Math.min(copyGroup.to, endIndex);
      map.set(Math.max(from, startIndex), copyGroup);

      if (from >= startIndex && group.to <= endIndex) {
        // The range fully covers the groups, so we can remove it.
        groups.delete(from);
      } else if (from < startIndex && endIndex >= group.to) {
        // We are starting from the end of the group, so shrink the end of it.
        group.to = Math.max(startIndex - 1, 0);
      } else if (group.to > endIndex && startIndex <= from) {
        // We are starting from the start of the group, so shrink the start of
        // it.
        groups.delete(from);
        groups.set(endIndex + 1, group);
      }
    });
  }

  const isAscending = afterViewIndex > startIndex;
  const isAddition = !isAscending;
  // We don't touch the data that is behind the target or start index,
  // that is why you are seeing a bunch of `+1`s or `-1`s.
  const startPos = isAscending ? endIndex + 1 : afterViewIndex + 1;
  const endPos = isAscending ? afterViewIndex : startIndex - 1;

  // Shift indexes of the groups that are in between of the reordered range and
  // and the location that reordered range will end up at.
  for (let i = 0; i < groupsArray.length; i++) {
    const groups = groupsArray[i];
    const realStartPos = groups.getPairOrNextLower(startPos)?.[0] ?? startPos;
    const reorderingData = groups.getRange(realStartPos, endPos, true);

    for (let i = 0; i < reorderingData.length; i++) {
      // We loop in reverse order when the target index is bigger than start
      // index so that we can make room for the moved data without overwriting
      // anything.
      const [from, group] =
        reorderingData[isAscending ? i : reorderingData.length - 1 - i];

      if (startPos <= group.to && endPos >= group.to) {
        if (isAddition) {
          group.to += total;
        } else {
          group.to -= total;
        }
      }

      if (startPos <= from && endPos >= from) {
        groups.delete(from);
        groups.set(isAddition ? from + total : from - total, group);
      }
    }
  }

  // Here we move the groups we previously collected for the reordered range.
  // We merge them with the existing ones where needed.
  const diff = isAddition
    ? afterViewIndex - startIndex + 1
    : afterViewIndex - (endIndex - startIndex) - startIndex;
  for (let i = 0; i < movingGroups.length; i++) {
    const groups = groupsArray[i];
    const map = movingGroups[i];
    for (const pair of map) {
      let from = pair[0] + diff;
      const group = pair[1];
      group.to += diff;

      // In the possible merge areas, we are following a Sheets behavior where
      // two groups are merged if there is only one row/col between them.
      const possibleLeftMerge = groups.getPairOrNextLower(from);
      if (
        possibleLeftMerge &&
        possibleLeftMerge[0] < from &&
        possibleLeftMerge[1].to + 1 >= from
      ) {
        from = possibleLeftMerge[0];
        group.to = Math.max(possibleLeftMerge[1].to, group.to);
      }

      // See above: Sheets behavior.
      const possibleRightMerge = groups.getPairOrNextHigher(group.to);
      if (
        possibleRightMerge &&
        possibleRightMerge[1].to > group.to &&
        possibleRightMerge[0] - 1 <= group.to
      ) {
        group.to = possibleRightMerge[1].to;
        from = Math.min(possibleRightMerge[0], from);
      }

      groups.deleteRange(from, group.to, true);
      groups.set(from, group);
    }
  }
};

/**
 * Checks if a new group is creatable for the given indexes.
 * @param groupsArray To check.
 * @param from The start index of the new group.
 * @param to The end index of the new group.
 * @returns True if cretable, or false if {@link from} is 0 (or smaller), or
 *  there is already a group fro the given indexes.
 */
const isNewGroupRangeValid = (
  groupsArray: GroupData[],
  from: number,
  to: number,
) => {
  for (let i = 0; i < groupsArray.length; i++) {
    const groups = groupsArray[i];
    const group = groups.get(from);
    if (group && group.to == to) return false;
  }
  return true;
};

/**
 * Merge a new hidden row range into existed ranges array
 * @param {any[]} hiddenRowRanges tuples: Array<[bgeinRowIndex, endRowIndex]>
 * @param {number[]} newRange tuple: [beginRowIndex, endRowIndex]
 * @returns {boolean}
 */
const mergeHiddenRowRanges = function (
  hiddenRowRanges: BTree<number, number>,
  newRange: number[],
): boolean {
  const [start, end] = newRange;
  if (end < start) return false;

  // optimize for emtpy ranges
  if (hiddenRowRanges.size === 0) {
    hiddenRowRanges.set(start, end);
    return true;
  }

  let baseKey = start;
  const lower = hiddenRowRanges.nextLowerPair(start + 1);
  if (lower) {
    const lowerEnd = lower[1];
    if (lowerEnd >= end) return true;
    if (lowerEnd >= start - 1) baseKey = lower[0];
  }

  let largestEnd = end;
  hiddenRowRanges.editRange(baseKey + 1, largestEnd + 1, true, (k, v) => {
    if (v > largestEnd) largestEnd = v;
    return { delete: true };
  });

  hiddenRowRanges.set(baseKey, largestEnd);
  return true;
};

export {
  addGroup,
  removeGroup,
  isNewGroupRangeValid,
  mergeHiddenRowRanges,
  reorderGroups,
};
