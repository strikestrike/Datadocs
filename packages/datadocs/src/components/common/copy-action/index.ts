import ClipboardJS from "clipboard";

export type CopyOptions = {
  /** Text content to be copied */
  content: string;
  /** Callback for use after coping successfully */
  onSuccess?: () => void;
  /** Callback for use when there is an error on coping */
  onError?: (error?: ClipboardJS.Event) => void;
};

/**
 * Use for coping text content into Clipboard
 * @param triggerElement
 * @param options
 * @returns
 */
export function copyAction(triggerElement: HTMLElement, options: CopyOptions) {
  const clipboard = new ClipboardJS(triggerElement, {
    text: function () {
      return options.content;
    },
  });

  // Successfully copy text into clipboard
  clipboard.on("success", () => {
    if (isFunction(options?.onSuccess)) {
      options.onSuccess();
    }
  });

  // Fail to copy text into clipboard
  clipboard.on("error", (event) => {
    if (isFunction(options?.onError)) {
      options.onError(event);
    }
  });

  return {
    update(newOptions: CopyOptions) {
      options = newOptions;
    },
    destroy() {
      clipboard.destroy();
    },
  };
}

function isFunction(value: any) {
  return typeof value === "function";
}
