import type { Pane, PaneProps } from "../../../layout/_dprctd/types";

export type LayerItem = {
  id: string;
  pane: Pane;
  parent: LayerItem | null;
  type: string;
  label: string;
  isGroup: boolean;
  isInTab?: boolean;
  index?: number;
  children?: Array<LayerItem>;
  settings: {
    noHide: boolean;
    noDelete: boolean;
    noLock: boolean;
    isHidden?: boolean;
    isLocked?: boolean;
  };
};

export type LayersContext = {
  isReordering: Writable<boolean>;
  drag: {
    active: boolean;
    sourceIndex: number;
    targetIndex: number;
    sourceId: string;
    targetId: string;
    source?: LayerItem;
    target?: LayerItem;
  };
  resetDrag: Function;
};
