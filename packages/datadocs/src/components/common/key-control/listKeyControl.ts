import { hasValue, getFirstElementIndex, getLastElementIndex } from "./utils";

export const CONTROL_BY_TAB_KEY = "CONTROL_BY_TAB_KEY";
export const CONTROL_BY_ARROW_KEY = "CONTROL_BY_ARROW_KEY";
export type KeyControlType =
  | typeof CONTROL_BY_TAB_KEY
  | typeof CONTROL_BY_ARROW_KEY;
const DEFAULT_CONTROL_ORIENTATION = "vertical";

export type KeyControlConfig = {
  isSelected: boolean;
  index: number;
  onSelectCallback: (byKey?: boolean) => void;
  onDeselectCallback: (byKey?: boolean) => void;
  onEnterKeyCallback?: (event: KeyboardEvent) => void;
};

export type RegisterElementOptions = {
  config: KeyControlConfig;
  configList: KeyControlConfig[];
  index: number;
  selectOnHover?: boolean;
  disabled?: boolean;
};

export type KeyControlActionOptions = {
  configList: KeyControlConfig[];
  keyControlType?: KeyControlType;
  disabled?: boolean;
  selectFromOutside?: (v: number) => void;
  deselectFromOutside?: (v: number) => void;
  /**
   * when doing key control for list with arrow key, there are two possible cases:
   * - use arrow up/down for vertical menu
   * - use arrow left/right for horizontal menu
   * The default value should be vertical
   */
  controlOrientation?: "horizontal" | "vertical";
};

function setListElement(
  list: KeyControlConfig[],
  value: KeyControlConfig,
  index: number
) {
  list[index] = value;
}

function findActiveElementIndex(list: KeyControlConfig[]): number {
  return list.findIndex((v) => hasValue(v) && v.isSelected === true);
}

function handleSelectElement(config: KeyControlConfig, byKey = true) {
  config.isSelected = true;
  config.onSelectCallback(byKey);
}

function handleDeselectElement(config: KeyControlConfig, byKey = true) {
  config.isSelected = false;
  config.onDeselectCallback(byKey);
}

export function registerElement(
  element: HTMLElement,
  options: RegisterElementOptions
) {
  const configList = options.configList;
  const index = options.index;
  const config = options.config;
  const selectOnHover = options.selectOnHover ?? true; // select element on mouse hovering is default behavior
  let disabled = options.disabled;

  if (!disabled) {
    setListElement(configList, config, index);
  }

  function handleMouseEnter() {
    if (disabled) return;

    const activeIndex = findActiveElementIndex(configList);

    if (activeIndex !== -1) {
      const activeConfig = configList[activeIndex];
      handleDeselectElement(activeConfig);
    }

    handleSelectElement(config, false);
  }

  function handleMouseLeave() {
    if (disabled) return;

    handleDeselectElement(config, false);
  }

  function handleEnterKeyDown(event: KeyboardEvent) {
    if (
      !disabled &&
      typeof config.onEnterKeyCallback === "function" &&
      event.key === "Enter" &&
      config.isSelected
    ) {
      config.onEnterKeyCallback(event);
    }
  }

  if (selectOnHover) {
    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
  }
  if (config.onEnterKeyCallback) {
    document.addEventListener("keydown", handleEnterKeyDown);
  }

  return {
    update(options: RegisterElementOptions) {
      disabled = options.disabled;
      if (disabled) {
        setListElement(configList, undefined, index);
      } else {
        setListElement(configList, config, index);
      }
    },
    destroy() {
      setListElement(configList, undefined, index);
      if (selectOnHover) {
        element.removeEventListener("mouseenter", handleMouseEnter);
        element.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (config.onEnterKeyCallback) {
        document.removeEventListener("keydown", handleEnterKeyDown);
      }
    },
  };
}

export function keyControlAction(
  element: HTMLElement,
  options: KeyControlActionOptions
) {
  let { configList, disabled } = options;
  const keyControlType = options.keyControlType ?? CONTROL_BY_ARROW_KEY;
  const controlOrientation =
    options.controlOrientation ?? DEFAULT_CONTROL_ORIENTATION;

  function getFirstIndex(from?: number): number {
    if (!hasValue(from)) {
      from = -1;
    }

    return getFirstElementIndex(configList, (v) => hasValue(v), from);
  }

  function getLastIndex(from?: number): number {
    if (!hasValue(from)) {
      from = configList.length;
    }

    return getLastElementIndex(configList, (v) => hasValue(v), from);
  }

  function getNextIndex(idx: number): number {
    let result: number;
    result = getFirstIndex(idx);

    if (result === -1) {
      result = getFirstIndex();
    }

    return result;
  }

  function getPreviousIndex(idx: number): number {
    let result: number;
    result = getLastIndex(idx);

    if (result === -1) {
      result = getLastIndex();
    }

    return result;
  }

  function navigateDown() {
    const currIdx = findActiveElementIndex(configList);
    let config: KeyControlConfig;

    if (currIdx === -1) {
      config = configList[getFirstIndex()];
      handleSelectElement(config);
    } else {
      config = configList[getNextIndex(currIdx)];
      if (!config) {
        return;
      }

      handleDeselectElement(configList[currIdx]);
      handleSelectElement(config);
    }
  }

  function navigateUp() {
    const currIdx = findActiveElementIndex(configList);
    let config: KeyControlConfig;

    if (currIdx === -1) {
      config = configList[getLastIndex()];
      handleSelectElement(config);
    } else {
      config = configList[getPreviousIndex(currIdx)];
      if (!config) {
        return;
      }

      handleDeselectElement(configList[currIdx]);
      handleSelectElement(config);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    const key = event.key;

    if (keyControlType === CONTROL_BY_ARROW_KEY) {
      if (controlOrientation === "vertical") {
        if (key === "ArrowUp") {
          navigateUp();
          event.preventDefault();
        } else if (key === "ArrowDown") {
          navigateDown();
          event.preventDefault();
        }
      } else {
        if (key === "ArrowLeft") {
          navigateUp();
          event.preventDefault();
        } else if (key === "ArrowRight") {
          navigateDown();
          event.preventDefault();
        }
      }
    } else if (key === "Tab") {
      const isShift = event.shiftKey;
      if (!isShift) {
        navigateDown();
      } else {
        navigateUp();
      }
    }

    // prevent browser default Tab key behavior when using key control
    if (key === "Tab") {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  options.selectFromOutside = (idx: number) => {
    const activeIndex = findActiveElementIndex(configList);
    const activeConfig = configList[activeIndex];
    const config = configList[idx];

    if (hasValue(activeConfig)) {
      activeConfig.isSelected = false;
    }

    if (hasValue(config)) {
      config.isSelected = true;
    }
  };

  options.deselectFromOutside = (idx: number) => {
    const config = configList[idx];

    if (hasValue(config) && config.isSelected) {
      config.isSelected = false;
    }
  };

  if (!disabled) window.addEventListener("keydown", handleKeyDown, true);

  return {
    update(options: KeyControlActionOptions) {
      const disabledChange = disabled !== options.disabled;
      disabled = options.disabled;
      if (disabledChange) {
        disabled
          ? window.removeEventListener("keydown", handleKeyDown, true)
          : window.addEventListener("keydown", handleKeyDown, true);
      }
    },
    destroy() {
      configList = undefined;
      window.removeEventListener("keydown", handleKeyDown, true);
    },
  };
}
