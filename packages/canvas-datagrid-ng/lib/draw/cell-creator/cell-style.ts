import type { CellStyleDeclaration } from '../../types/cell';
import type { GridHeader } from '../../types/column-header';
import type {
  CellMetaForConflicts,
  CellMetaForUnsavedChanges,
} from '../../types/cell-meta';
import type { GridPrivateProperties } from '../../types/grid';
import type { CellMeta } from '../../data/data-source/spec/base';
import { columnTypeToString } from '../../utils/column-types';
import { getDefaultStyleForDataType } from '../../style/style';
import type { CellBorder, CellLinkedNode } from '../../types';

export class CellStyleCreator {
  constructor(private readonly self: GridPrivateProperties) {}

  addStyleFromMeta(
    style: Readonly<CellStyleDeclaration> | null | undefined,
    meta: Readonly<CellMeta>,
  ): CellStyleDeclaration {
    if (!meta) return style || ({} as any);

    let result: CellStyleDeclaration;
    if (style) result = { ...style };
    else result = {} as any;

    const gridStyle = this.self.style;

    //#region conflicts
    if ((meta as CellMetaForConflicts).conflicts) {
      result.cornerColorTR = gridStyle.conflictFlagColor;
      /** @todo define this constant value into the style folder */
      result.cornerSizeTR = 4;
    }
    //#endregion conflicts

    //#region unsaved changes
    if ((meta as CellMetaForUnsavedChanges).unsaved) {
      const { isNew, isRemoved } = (meta as CellMetaForUnsavedChanges).unsaved;
      if (isNew) result.backgroundColor = gridStyle.unsavedInsertBackground;
      else if (isRemoved)
        result.backgroundColor = gridStyle.unsavedDeleteBackground;
      else result.backgroundColor = gridStyle.unsavedUpdateBackground;
    }
    //#endregion unsaved changes

    return result;
  }
}

/**
 * It is used to merge default style of a specific data type into
 * custom style, user custom style will override the default one
 * @param style
 * @param meta
 * @returns
 */
export function addCellDefaultStyle(
  style: Readonly<Partial<CellStyleDeclaration>> | null | undefined,
  meta: Readonly<CellMeta>,
  header: Readonly<GridHeader>,
  cellValue: any = '',
  linkStyle: Partial<CellStyleDeclaration>,
): Partial<CellStyleDeclaration> {
  if (!meta && !header) return style || {};

  let result: Partial<CellStyleDeclaration>;
  if (style) result = { ...style };
  else result = {};

  if (meta?.parserData) {
    const defaultStyle = getDefaultStyleForDataType(
      meta.parserData.dataType,
      meta.parserData.value,
      style?.dataFormat,
      linkStyle,
    );
    result = mergeCellMetadataProperty(defaultStyle, result, true);
  }

  // header style is less important than cell style
  if (header?.type) {
    let cellType = columnTypeToString(header.type);
    if (cellType === 'variant') {
      cellType = cellValue?.dataType ?? cellType;
    }
    const defaultStyle = getDefaultStyleForDataType(
      cellType,
      cellValue,
      style?.dataFormat,
      linkStyle,
    );
    result = mergeCellMetadataProperty(defaultStyle, result, true);
  }

  return result;
}

/**
 * Add column style into cell style
 * @param style
 * @param header
 * @returns
 */
export function addColumnStyle(
  style: Readonly<Partial<CellStyleDeclaration>> | null | undefined,
  header: Readonly<GridHeader>,
) {
  const columnStyle = header?.columnStyle;
  const dataFormat =
    (style?.dataFormat?.type && style?.dataFormat) ||
    (columnStyle?.dataFormat?.type && columnStyle.dataFormat);
  const newStyle = mergeCellMetadataProperty(columnStyle, style, true);
  // Data format should be from one, not merge together
  newStyle.dataFormat = dataFormat;
  return newStyle;
}

/**
 * Add column border style, check if there is no custom border on
 * the cell or its neigbour. If not, using table column style.
 *
 * @param grid
 * @param node
 * @returns
 */
export function addColumnBorders(
  grid: GridPrivateProperties,
  node: CellLinkedNode,
) {
  function markAscolumnBorder(border: CellBorder): CellBorder {
    return { ...border, type: 'column' };
  }

  const { cell } = node;
  const { tableHeader: header, table, rowIndex } = cell;

  if (header?.borderStyle) {
    const customBorders = cell.customBorders ? { ...cell.customBorders } : {};
    const headerBorder = header.borderStyle;

    const firstCell = table.firstRowIndex === rowIndex;
    const lastCell = table.lastRowIndex === rowIndex;

    if (headerBorder?.left) {
      const borderLeft =
        customBorders.left ?? markAscolumnBorder(headerBorder.left);
      if (borderLeft.type !== 'column') {
        customBorders.left = borderLeft;
      } else {
        const prevBorderRight = node?.prevSibling?.cell?.customBorders?.right;
        if (
          prevBorderRight &&
          prevBorderRight.type !== 'column' &&
          prevBorderRight.type !== 'table'
        ) {
          customBorders.left = null;
        } else {
          customBorders.left = borderLeft;
        }
      }
    }

    if (headerBorder?.right) {
      customBorders.right =
        customBorders.right ?? markAscolumnBorder(headerBorder.right);
    }

    if (headerBorder?.top && firstCell) {
      const borderTop =
        customBorders.top ?? markAscolumnBorder(headerBorder.top);
      if (borderTop.type !== 'column') {
        customBorders.top = borderTop;
      } else {
        const upperBorderBottom =
          node?.upperSibling?.cell?.customBorders?.bottom;
        if (
          upperBorderBottom &&
          upperBorderBottom.type !== 'column' &&
          upperBorderBottom.type !== 'table'
        ) {
          customBorders.top = null;
        } else {
          customBorders.top = borderTop;
        }
      }
    }

    if (headerBorder?.bottom && lastCell) {
      customBorders.bottom =
        customBorders.bottom ?? markAscolumnBorder(headerBorder.bottom);
    }

    if (headerBorder?.inner) {
      if (!firstCell) {
        const borderTop =
          customBorders.top ?? markAscolumnBorder(headerBorder.inner);
        if (borderTop.type !== 'column') {
          customBorders.top = borderTop;
        } else {
          const upperBorderBottom =
            node?.upperSibling?.cell?.customBorders?.bottom;
          if (
            upperBorderBottom &&
            upperBorderBottom.type !== 'column' &&
            upperBorderBottom.type !== 'table'
          ) {
            customBorders.top = null;
          } else {
            customBorders.top = borderTop;
          }
        }
      }
      if (!lastCell) {
        customBorders.bottom =
          customBorders.bottom ?? markAscolumnBorder(headerBorder.inner);
      }
    }

    cell.customBorders = customBorders;
  }
}

/**
 * Merge cell metadata/style/data-format, which are plain objects
 * @param target
 * @param source
 * @param ignoreEmpty Indicate that undefined/null value will be ignored
 * @returns
 */
export function mergeCellMetadataProperty<T>(
  target: T,
  source: Partial<T>,
  ignoreEmpty = false,
): T {
  target = target ?? ({} as T);
  source = source ?? ({} as T);
  const merged = { ...target };

  for (const key in source) {
    if (source[key] == null) {
      if (!ignoreEmpty) merged[key] = source[key];
    } else if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
      merged[key] = mergeCellMetadataProperty(
        target[key],
        source[key],
        ignoreEmpty,
      );
    } else {
      merged[key] = source[key];
    }
  }

  return merged;
}
