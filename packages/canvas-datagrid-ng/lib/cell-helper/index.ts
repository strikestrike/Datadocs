import type { GridPrivateProperties } from '../types/grid';
import type {
  CellErrorData,
  CellPreview,
  CellPreviewData,
  CellPreviewStyle,
} from './types';
import { copyMethods } from '../util';
import type { CellDescriptor } from '../types/cell';

export default function loadGridCellHelper(self: GridPrivateProperties) {
  copyMethods(new GridCellHelper(self), self);
}

export class GridCellHelper {
  private _cellErrorData: CellErrorData = null;
  private _cellPreviewData: CellPreviewData = null;

  constructor(private readonly grid: GridPrivateProperties) {
    // Event listeners here is just an example of using cell error
    // and cell preview. Feel free to change it.

    // Listen to mouse enter a cell event to show cell error
    grid.addEventListener('cellmouseover', (event: any) => {
      this.showCellError(event.cell);
    });

    grid.addEventListener('beginedit', () => {
      this.hideCellError();
    });

    /*
    // Show cell preview when type in cell editor
    grid.addEventListener('beginedit', () => {
      if (!grid.input) return;
      grid.input.addEventListener('input', () => {
        this.showCellPreview();
      });
    });

    // Hide cell preview once end editing
    grid.addEventListener('endedit', () => {
      this.hideCellPreview();
    });
    */
  }

  /**
   * Extract error message from cell
   *
   * TODO: Implement real logic for getting error message.
   * Currently it returns a sample message
   * @param cell
   * @returns
   */
  getCellErrorMessage = (cell: CellDescriptor) => {
    const meta =
      cell.meta ??
      this.grid.dataSource.getCellMeta(cell.rowIndex, cell.columnIndex);
    if (!meta) return;
    return meta.cellError;
  };

  /**
   * Show cell error. It should be called when we want to show
   * the cell error.
   * @param cell
   * @param message
   * @returns
   */
  showCellError = (cell: CellDescriptor, message?: string | string[]) => {
    message = message ?? this.getCellErrorMessage(cell);
    // Don't show cell error when input editing
    if (!message || this.grid.input) return this.hideCellError();
    const self = this.grid;
    const canvasBounds = self.canvas.getBoundingClientRect();
    const { x, y, width, height } = cell;
    this._cellErrorData = {
      rect: {
        x: self.px(x) + canvasBounds.left,
        y: self.px(y) + canvasBounds.top,
        width: self.px(width),
        height: self.px(height),
      },
      message,
    };
    self.dispatchEvent('showcellerror', {
      data: structuredClone(this._cellErrorData),
    });
  };

  /**
   * Hide cell error. It should be called to close the
   * openned cell error
   */
  hideCellError = () => {
    this._cellErrorData = null;
    this.grid.dispatchEvent('hidecellerror', {});
  };

  /**
   * Get cell preview message
   *
   * Currently it returns content of the cell editor
   *
   * TODO: You may want to extract the preview message from
   * the cell editor.
   */
  getCellPreviewMessage = (): CellPreview => {
    if (!this.grid.input?.editCell) return;
    return this.grid.input.editCell.previewMessage;
  };

  setCellPreviewMessage = (message: CellPreview) => {
    if (!this.grid.input?.editCell) return;
    this.grid.input.editCell.previewMessage = message;
  };

  hasCellBadge = () => {
    // Cell badge display is set to 'none' whenever we want to hide it
    return (
      !!this.grid.input && this.grid.input.cellBadge.style.display !== 'none'
    );
  };

  /**
   * Get style information of cell preview
   *
   * As cell preview can be stand next to cell badge, cell preview
   * should inherit the style from cell badge such as height,
   * font-size and margin-bottom (distance to the cell editor)
   */
  getCellPreviewStyle = (): CellPreviewStyle => {
    const self = this.grid;
    return {
      height: self.dp(self.style.editCellBadgeHeight, self.userScale),
      marginBottom: self.dp(
        self.style.editCellBadgeMarginBottom,
        self.userScale,
      ),
      fontSize: self.dp(self.style.editCellPreviewFontSize, self.userScale),
      fontFamily: self.style.editCellPreviewFontFamily,
    };
  };

  getCellPreviewRect = () => {
    const self = this.grid;
    if (!self.input) return null;
    const { x, y, width, height, right } = self.input.getBoundingClientRect();
    if (this.hasCellBadge()) {
      const cellBadgeBound = self.input.cellBadge.getBoundingClientRect();
      return {
        x: cellBadgeBound.right,
        y,
        width: right - cellBadgeBound.right,
        height,
      };
    } else {
      return { x, y, width, height };
    }
  };

  /**
   * Update preview position
   *
   * As cell preview is showed depend on cell editor position,
   * this function is called once the cell editor has changed.
   * @returns
   */
  updateCellPreviewPosition = () => {
    if (!this._cellPreviewData || !this.grid.input) return;
    Object.assign(this._cellPreviewData, {
      rect: this.getCellPreviewRect(),
      hasCellBadge: this.hasCellBadge(),
      ...this.getCellPreviewStyle(),
    });
    this.grid.dispatchEvent('showcellpreview', {
      data: structuredClone(this._cellPreviewData),
    });
  };

  /**
   * Show cell preview, should be called to show the cell preview.
   * @param message
   */
  showCellPreview = (message?: CellPreview) => {
    const self = this.grid;
    if (!self.input) return this.hideCellPreview();
    message = message ?? this.getCellPreviewMessage();
    if (!message) return this.hideCellPreview();
    this._cellPreviewData = {
      rect: this.getCellPreviewRect(),
      message: message.value,
      hasCellBadge: this.hasCellBadge(),
      ...this.getCellPreviewStyle(),
    };
    self.dispatchEvent('showcellpreview', {
      data: structuredClone(this._cellPreviewData),
    });
  };

  /**
   * Hide cell preview, should be called to close the opened cell preview.
   */
  hideCellPreview = () => {
    this._cellPreviewData = null;
    this.grid.dispatchEvent('hidecellpreview', {});
  };

  /**
   * Users trigger hide cell preview
   *
   * TODO: We may want to add additional logic about show/hiding cell preview
   * as it is action from users and they prefer not to have cell preview.
   */
  onUserHideCellPreview = () => {
    this.hideCellPreview();
  };
}
