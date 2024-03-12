import type {
  CellPreview,
  CellStyleDeclaration,
  GridPrivateProperties,
  NormalCellDescriptor,
} from '../types';
import type { EditorCore } from './core';
import type { EditorElementFunctions } from './utils';
import type { EditorKeyBoardCommand } from './keyboard-command';
import type { EditorSelection } from './selection';
import type { EditorHistory } from './history';
import type { EditorHyperlink } from './hyperlink';
import type { MetaRun, StyleRun } from '../types/style';

export interface EditorPrivateMethods
  extends Omit<EditorKeyBoardCommand, 'self'>,
    Omit<EditorCore, 'self'>,
    Omit<EditorSelection, 'self'>,
    Omit<EditorElementFunctions, 'self'>,
    Omit<EditorHistory, 'self'>,
    Omit<EditorHyperlink, 'self'> {}

export type EditorProperties = EditorPrivateMethods;

export type EditorLinkRun = MetaRun & {
  id: string;
};

export type EditorElement = HTMLElement &
  (HTMLDivElement | HTMLSelectElement) & {
    /**
     * The cell that is being edited.
     */
    editCell: NormalCellDescriptor & { previewMessage?: CellPreview };
    grid: GridPrivateProperties;
    /**
     * The element that is shown when the input doesn't align with the
     * grid position of the cell that is being edited.
     */
    cellBadge: HTMLElement;
    /**
     * Hyperlinks inside the text of editor. The state is retrive from the
     * cell data at starting point and then change over time when user customs
     * it.
     */
    linkRuns?: EditorLinkRun[];
    /**
     * Indicate the current link-runs in grid editor is explicit (user-defined)
     * or implicit (auto-generated). We don't store implicit links.
     */
    explicitLink?: boolean;
    /**
     * Whether the edit cell type is string or not
     */
    isString?: boolean;
  } & EditorProperties;

export type EditorModuleLoader = (self: EditorElement) => void;

export interface EditorCellData {
  text: string;
  styles: StyleRun[];
  linkRuns?: EditorElement['linkRuns'];
  actualLinksLength?: EditorProperties['actualLinksLength'];
}

export type EditorChildNodeData = {
  tag: 'span' | 'a';
  textContent: string;
  style: Partial<CellStyleDeclaration>;
  href?: string;
  id?: string;
};
