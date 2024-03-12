import {
  getElementIndex,
  getFirstElementIndex,
  getLastElementIndex,
  hasValue,
} from "./utils";

export type GridNavigationKey = "arrow-left" | "arrow-right";

export type GridKeyControlConfig = {
  isSelected: boolean;
  cidx: number;
  ridx: number;
  onSelectCallback: (byKey: boolean) => void;
  onDeselectCallback: (byKey: boolean) => void;
  onEnterKeyCallback?: () => void;
  onNavigationKeyCallback?: (key: GridNavigationKey) => boolean;
};

export type RegisterElementOptions = {
  config: GridKeyControlConfig;
  gridKeyControlOptions: GridKeyControlActionOptions;
  cidx: number;
  ridx: number;
  selectOnHover?: boolean;
  disabled?: boolean;
};

export type GridKeyControlActionOptions = {
  configList: GridKeyControlConfig[][];
  setColumnPositionFromIndex?: (ridx: number, cidx: number) => void;
  disabled?: boolean;
  selectFromOutside?: (ridx: number, cidx: number) => void;
  deselectFromOutside?: (ridx: number, cidx: number) => void;
};

function setListElement(
  list: GridKeyControlConfig[][],
  config: GridKeyControlConfig,
  ridx: number,
  cidx: number
) {
  if (!hasValue(list[ridx])) {
    list[ridx] = [];
  }

  list[ridx][cidx] = config;
}

function isConfigSelected(config: GridKeyControlConfig): boolean {
  return config && config.isSelected === true;
}

function isRowEmpty(row: GridKeyControlConfig[]) {
  return !hasValue(row) || row.length === 0 || row.every((v) => !hasValue(v));
}

function findActiveElementIndex(
  list: GridKeyControlConfig[][]
): [number, number] {
  let ci = -1,
    ri = -1;

  for (let i = 0; i < list.length; i++) {
    const configs = list[i];
    const j = hasValue(configs)
      ? getElementIndex(configs, isConfigSelected)
      : -1;

    if (j !== -1) {
      ri = i;
      ci = j;
      break;
    }
  }

  return [ri, ci];
}

function handleSelectElement(config: GridKeyControlConfig, byKey = true) {
  if (!hasValue(config)) {
    return;
  }

  config.isSelected = true;
  config.onSelectCallback(byKey);
}

function handleDeselectElement(config: GridKeyControlConfig, byKey = true) {
  if (!hasValue(config)) {
    return;
  }

  config.isSelected = false;
  config.onDeselectCallback(byKey);
}

export function registerElement(
  element: HTMLElement,
  options: RegisterElementOptions
) {
  const { gridKeyControlOptions, config, ridx, cidx } = options;
  const configList = gridKeyControlOptions.configList;
  const selectOnHover = options.selectOnHover ?? true; // select element on mouse hovering is default behavior
  let disabled = options.disabled;

  if (!disabled) {
    setListElement(configList, config, ridx, cidx);
  }

  function handleMouseEnter() {
    if (disabled) return;

    const [ri, ci] = findActiveElementIndex(configList);

    if (ri !== -1 && ci !== -1) {
      const activeConfig = configList[ri][ci];
      handleDeselectElement(activeConfig);
    }

    handleSelectElement(config, false);
    gridKeyControlOptions.setColumnPositionFromIndex(ridx, cidx);
  }

  function handleMouseLeave() {
    if (disabled) return;

    handleDeselectElement(config, false);
  }

  function handleEnterKeyDown(event: KeyboardEvent) {
    if (
      !disabled &&
      typeof config.onSelectCallback === "function" &&
      event.key === "Enter" &&
      config.isSelected
    ) {
      config.onEnterKeyCallback();
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
        setListElement(configList, undefined, ridx, cidx);
      } else {
        setListElement(configList, config, ridx, cidx);
      }
    },
    destroy() {
      setListElement(configList, undefined, ridx, cidx);
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

export function gridKeyControlAction(
  element: HTMLElement,
  options: GridKeyControlActionOptions
) {
  let configList = options.configList;
  let disabled = options.disabled;
  let columnPosition = 1;

  function setColumnPosition(idx: number) {
    columnPosition = idx;
  }

  function getColumnPosition(): number {
    return columnPosition;
  }

  options.setColumnPositionFromIndex = (ridx: number, cidx: number) => {
    const position = getPositionFromIndex(configList[ridx], cidx);
    setColumnPosition(position);
  };

  options.selectFromOutside = (ridx: number, cidx: number) => {
    const [ri, ci] = findActiveElementIndex(configList);
    const nextActiveConfig = configList[ridx] && configList[ridx][cidx];
    const activeConfig = configList[ri] && configList[ri][ci];
    if (activeConfig === nextActiveConfig) return;
    if (activeConfig) activeConfig.isSelected = false;
    if (nextActiveConfig) {
      nextActiveConfig.isSelected = true;
      options.setColumnPositionFromIndex(ridx, cidx);
    }
  };

  options.deselectFromOutside = (ridx: number, cidx: number) => {
    const config = configList[ridx] && configList[ridx][cidx];
    if (config) config.isSelected = false;
  };

  function findFirstIndex(ridx?: number, cidx?: number): [number, number] {
    let ci = -1,
      ri = -1;

    if (hasValue(ridx) && hasValue(cidx)) {
      const configs = configList[ridx];
      const i = ridx;
      const j = hasValue(configs)
        ? getFirstElementIndex(configs, hasValue, cidx)
        : -1;

      if (j !== -1) {
        return [i, j];
      }

      ridx++;
    } else {
      ridx = 0;
    }

    for (let i = ridx; i < configList.length; i++) {
      const configs = configList[i];
      const j = hasValue(configs)
        ? getFirstElementIndex(configs, hasValue)
        : -1;

      if (j !== -1) {
        ri = i;
        ci = j;
        break;
      }
    }

    return [ri, ci];
  }

  function findLastIndex(ridx?: number, cidx?: number): [number, number] {
    let ci = -1,
      ri = -1;

    if (hasValue(ridx) && hasValue(cidx)) {
      const configs = configList[ridx];
      const i = ridx;
      const j = hasValue(configs)
        ? getLastElementIndex(configs, hasValue, cidx)
        : -1;

      if (j !== -1) {
        return [i, j];
      }

      ridx--;
    } else {
      ridx = configList.length - 1;
    }

    for (let i = ridx; i >= 0; i--) {
      const configs = configList[i];
      const j = hasValue(configs) ? getLastElementIndex(configs, hasValue) : -1;

      if (j !== -1) {
        ri = i;
        ci = j;
        break;
      }
    }

    return [ri, ci];
  }

  function getPositionFromIndex(
    row: GridKeyControlConfig[],
    idx: number
  ): number {
    if (isRowEmpty(row) || !hasValue(row[idx])) {
      return -1;
    }

    let position = 0;
    for (let i = 0; i <= idx; i++) {
      if (hasValue(row[i])) {
        position += 1;
      }
    }

    return position;
  }

  function getIndexFromPosition(
    row: GridKeyControlConfig[],
    position: number
  ): number {
    if (isRowEmpty(row)) {
      return -1;
    }

    let index = -1;
    let count = 0;
    for (let i = 0; i < row.length; i++) {
      if (count >= position) {
        break;
      }

      if (hasValue(row[i])) {
        count += 1;
        index = i;
      }
    }

    return index;
  }

  function handleArrowLeft() {
    let [ri, ci] = findActiveElementIndex(configList);
    let columnPosition: number;

    if (ri === -1 || ci === -1) {
      [ri, ci] = findLastIndex();
      handleSelectElement(configList[ri][ci]);
      columnPosition = getPositionFromIndex(configList[ri], ci);
      setColumnPosition(columnPosition);
    } else {
      let [preRi, preCi] = findLastIndex(ri, ci);

      if (preRi === -1 || preCi === -1) {
        [preRi, preCi] = findLastIndex();
      }

      const currentSelection = configList[ri][ci];
      if (currentSelection.onNavigationKeyCallback?.("arrow-left")) {
        return false;
      }

      handleDeselectElement(currentSelection);
      handleSelectElement(configList[preRi][preCi]);
      columnPosition = getPositionFromIndex(configList[preRi], preCi);
    }

    setColumnPosition(columnPosition);

    return true;
  }

  function handleArrowRight() {
    let [ri, ci] = findActiveElementIndex(configList);
    let columnPosition: number;

    if (ri === -1 || ci === -1) {
      [ri, ci] = findFirstIndex();
      handleSelectElement(configList[ri][ci]);
      columnPosition = getPositionFromIndex(configList[ri], ci);
    } else {
      let [nextRi, nextCi] = findFirstIndex(ri, ci);

      if (nextRi === -1 || nextCi === -1) {
        [nextRi, nextCi] = findFirstIndex();
      }

      const selectedElement = configList[ri][ci];
      if (selectedElement.onNavigationKeyCallback?.("arrow-right")) {
        return false;
      }

      handleDeselectElement(selectedElement);
      handleSelectElement(configList[nextRi][nextCi]);
      columnPosition = getPositionFromIndex(configList[nextRi], nextCi);
    }

    setColumnPosition(columnPosition);

    return true;
  }

  function handleArrowUp() {
    const [ri, ci] = findActiveElementIndex(configList);
    let config: GridKeyControlConfig;
    let activeConfig: GridKeyControlConfig;
    let nextRi = -1,
      nextCi = -1;

    if (ri !== -1 && ci !== -1) {
      config = configList[ri][ci];

      for (let i = ri - 1; i >= 0; i--) {
        if (!isRowEmpty(configList[i])) {
          nextRi = i;
          break;
        }
      }
    }

    if (nextRi === -1) {
      for (let i = configList.length; i >= 0; i--) {
        if (!isRowEmpty(configList[i])) {
          nextRi = i;
          break;
        }
      }
    }

    if (nextRi === -1) {
      return;
    }

    const position = getColumnPosition();
    nextCi = getIndexFromPosition(configList[nextRi], position);
    activeConfig = configList[nextRi][nextCi];

    if (hasValue(config)) {
      handleDeselectElement(config);
    }

    if (hasValue(activeConfig)) {
      handleSelectElement(activeConfig);
    }
  }

  function handleArrowDown() {
    const [ri, ci] = findActiveElementIndex(configList);
    let config: GridKeyControlConfig;
    let activeConfig: GridKeyControlConfig;
    let nextRi = -1,
      nextCi = -1;

    if (ri !== -1 && ci !== -1) {
      config = configList[ri][ci];

      for (let i = ri + 1; i < configList.length; i++) {
        if (!isRowEmpty(configList[i])) {
          nextRi = i;
          break;
        }
      }
    }

    if (nextRi === -1) {
      for (let i = 0; i < configList.length; i++) {
        if (!isRowEmpty(configList[i])) {
          nextRi = i;
          break;
        }
      }
    }

    if (nextRi === -1) {
      return;
    }

    const position = getColumnPosition();
    nextCi = getIndexFromPosition(configList[nextRi], position);
    activeConfig = configList[nextRi][nextCi];

    if (hasValue(config)) {
      handleDeselectElement(config);
    }

    if (hasValue(activeConfig)) {
      handleSelectElement(activeConfig);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (disabled || configList.every((row) => isRowEmpty(row))) {
      return;
    }

    switch (event.key) {
      case "ArrowUp": {
        handleArrowUp();
        event.preventDefault();
        break;
      }
      case "ArrowDown": {
        handleArrowDown();
        event.preventDefault();
        break;
      }
      case "ArrowLeft": {
        if (handleArrowLeft()) event.preventDefault();
        break;
      }
      case "ArrowRight": {
        if (handleArrowRight()) event.preventDefault();
        break;
      }
      case "Tab": {
        event.preventDefault();
        event.stopPropagation();
        break;
      }
      default:
        break;
    }
  }

  window.addEventListener("keydown", handleKeyDown, true);
  return {
    update(options: GridKeyControlActionOptions) {
      const disabledChange = disabled !== options.disabled;
      disabled = options.disabled;
      if (disabledChange) {
        disabled
          ? window.removeEventListener("keydown", handleKeyDown, true)
          : window.addEventListener("keydown", handleKeyDown, true);
      }
    },
    destroy() {
      configList = null;
      window.removeEventListener("keydown", handleKeyDown, true);
    },
  };
}
