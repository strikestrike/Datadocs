import type {
  ConfirmDialogOptions,
  ConfirmDialogResult,
  ModalDialogProvider,
} from "@datadocs/canvas-datagrid-ng/lib/modal/spec";
import { ConfirmDialogChoice } from "@datadocs/canvas-datagrid-ng/lib/modal/spec";
import type { ModalConfigType } from "../../common/modal";
import { bind, closeModal, openModal } from "../../common/modal";
import MergeStrategyModal from "./MergeStrategyModal/Modal.svelte";
import { MergeStrategyModalResult } from "./MergeStrategyModal/types";

/**
 * @version 2023-01-09
 */
export class DatadocsGridModalProvider implements ModalDialogProvider {
  confirm = async (
    options: ConfirmDialogOptions
  ): Promise<ConfirmDialogResult> => {
    switch (options.name) {
      case "MERGE_UPSTREAM_STRATEGY": {
        let result = MergeStrategyModalResult.cancelled;
        const modal = bind(MergeStrategyModal, {
          onResult: (_result: MergeStrategyModalResult) => (result = _result),
        });

        let onClose: () => void;
        const waitForClosing = new Promise<void>(
          (resolve) => (onClose = resolve)
        );
        const modalConfig: ModalConfigType = {
          component: modal,
          isMovable: false,
          isResizable: false,
          minWidth: 580,
          minHeight: 200,
          preferredWidth: 580,
          allowOutsideClick: false,
          allowEscapeKey: false,
          onClose,
        };
        openModal(modalConfig);
        await waitForClosing;
        if (result === MergeStrategyModalResult.cancelled)
          return { choice: ConfirmDialogChoice.Cancelled };

        return { choice: ConfirmDialogChoice.Positive, extra: result };
      }
    }
    return { choice: ConfirmDialogChoice.Cancelled };
  };

  dispose(): void {
    closeModal();
  }
}
