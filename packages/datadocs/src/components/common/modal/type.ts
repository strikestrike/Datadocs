import type { SvelteComponentTyped } from "svelte";
import type { HOCProps } from "../../svelte-types";

export type CloseModalFunctionType = () => void;
export type MoveModalActionType = (element: HTMLElement) => void;
export type ModalConfigType<T extends SvelteComponentTyped> = HOCProps<T> & {
  // component: ComponentType<Component>;
  // props?: ComponentProps<Component>;
  // events?: ComponentEvents<Component>;
  // slots?: ComponentSlots<Component>;
  isMovable?: boolean;
  isResizable?: boolean;
  minWidth?: number;
  minHeight?: number;
  preferredWidth?: number;
  preferredHeight?: number;
  hasBackdrop?: boolean;
  allowOutsideClick?: boolean;
  allowEscapeKey?: boolean;
  onClose?: () => void;
};

export const defaultModalMinWidth = 150;
export const defaultModalMinHeight = 150;

export const defaultModalConfigType: Omit<ModalConfigType<any>, "component"> = {
  props: {},
  events: {},
  slots: {},
  isMovable: false,
  isResizable: false,
  minWidth: defaultModalMinWidth,
  minHeight: defaultModalMinHeight,
  hasBackdrop: true,
  allowOutsideClick: true,
  allowEscapeKey: true,
  onClose: () => {
    // Do nothing
  },
};

export const CLOSE_MODAL_CONTEXT_NAME = "Modal:Close";
export const MOVE_MODAL_ACTION_CONTEXT_NAME = "Modal:moveModalAction";
