## History Panel

There are 4 steps we need to add history (undo/redo) for new action:

### Step 1:

Define `StateType` and `ActionType` in https://github.com/datadocs/datadocs/blob/main/packages/datadocs/src/components/panels/History/types/type.ts. Eg, for action `Enter text in cell`, `StateType` is `"ENTER_VALUE"` and `ActionType` is `"GRID"`.

### Step 2:

Define state of action before performing it and class of action in https://github.com/datadocs/datadocs/tree/main/packages/datadocs/src/components/panels/History/types/history/actions. Eg, for `Grid value action`:

State:

```ts
export class ValueUndoState extends HistoryState {
  valueMap: Map<string, any>;
  constructor(type: ValueStateType, valueMap: Map<string, any>) {
    super(type);
    this.valueMap = valueMap;
  }
}

export class ValueRedoState extends HistoryState {
  valueMap: Map<string, any>;
  value: any;
  constructor(type: ValueStateType, valueMap: Map<string, any>, value: any) {
    super(type);
    this.valueMap = valueMap;
    this.value = value;
  }
}
```

Class of action:

```ts
export class ValueAction extends GridAction {
  constructor(
    selections: SelectionDescriptor[],
    activeCell: any,
    sheetId: string,
    gridActiveComponent: GridActiveComponent,
    undoState: ValueUndoState,
    redoState: ValueRedoState,
    userId: string,
    tags: string[]
  ) {
    tags.push("value");
    super(
      selections,
      activeCell,
      sheetId,
      gridActiveComponent,
      undoState,
      redoState,
      userId,
      tags,
      false
    );
  }

  get displayName(): string {
    const redoState = this.redoState as ValueRedoState;
    if (redoState.stateType === "CLEAR_VALUE") {
      return "Clear Value in " + this.getNameActiveCell();
    } else {
      const [text] = redoState.valueMap.values();
      return (
        "Typing '" +
        (text.length > HISTORY_TEXT_ACTION_MAX_LENGTH
          ? text.slice(0, HISTORY_TEXT_ACTION_MAX_LENGTH) + "..."
          : text) +
        "' in " +
        this.getNameActiveCell()
      );
    }
  }

  async undo(refresh: boolean) {
    this.handleSwitchSheetIfNeeded();
    this.handleGridActiveComponentIfNeeded();
    const grid = this.getActiveGrid();
    if (!grid) return;

    if (this.selections) {
      const undoState = this.undoState as ValueUndoState;
      grid.undoRedoCellsValue(
        this.selections,
        this.activeCell,
        undoState.valueMap,
        refresh
      );
    }
  }

  async redo(refresh: boolean) {
    this.handleSwitchSheetIfNeeded();
    this.handleGridActiveComponentIfNeeded();
    const grid = this.getActiveGrid();
    if (!grid) return;

    if (this.selections) {
      const redoState = this.redoState as ValueRedoState;
      const stateType: ValueStateType = redoState.stateType as ValueStateType;
      if (stateType === "ENTER_VALUE") {
        grid.undoRedoCellsValue(
          this.selections,
          this.activeCell,
          redoState.valueMap,
          refresh
        );
      } else {
        grid.redoClearCell(
          this.selections,
          this.activeCell,
          "content",
          refresh
        );
      }
    }
  }

  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    const redoState = this.redoState as ValueRedoState;
    const currentActiveCell = gridActiveCellMap.get(
      this.gridActiveComponent.activeView.id
    );

    return [
      new GridMacroAction(
        new ValueMacroState(
          redoState.stateType as ValueStateType,
          redoState.value
        ),
        this.getSelectionsOffset(reference, currentActiveCell),
        this.getActiveCellOffset(reference, currentActiveCell),
        this.getSheetName(),
        this.getViewName()
      ),
    ];
  }
}
```

Note that: action class need to implement inherited abstract functions 'displayName', 'undo', 'redo', 'toMacroAction'

### Step 3:

Define function to create history action in manager here: https://github.com/datadocs/datadocs/blob/main/packages/datadocs/src/app/store/panels/store-history-panel.ts. Eg, For `ValueAction`:

```ts
/**
 * create value action for history
 * @param selections
 * @param activeCell
 * @param stateType
 * @param oldValueMap
 * @param newValueMap
 * @param tags
 * @returns ValueAction
 */
export function createGridValueAction(
  selections: SelectionDescriptor[],
  activeCell: any,
  stateType: ValueStateType,
  oldValueMap: Map<string, any>,
  newValueMap: Map<string, any>,
  value: any,
  tags: string[] = [],
  userId: string = null
): ValueAction {
  return new ValueAction(
    selections,
    activeCell,
    getCurrentActiveSheet().id,
    appManager.getGridActiveComponent(),
    new ValueUndoState(stateType, oldValueMap),
    new ValueRedoState(stateType, newValueMap, value),
    userId,
    tags
  );
}
```

### Step 4:

Adding History Action to History Manager while perform this actions. Eg, For `ValueAction`, we define in file: https://github.com/datadocs/datadocs/blob/main/packages/datadocs/src/app/store/store-toolbar.ts, this is how to add `ValueAction` in `handleEndEdit` function:

```ts
function handleEndEdit() {
  if (!gridWithEditor) return;
  updateFormulaCellMetaData();

  grid.input.removeEventListener("input", updateFormulaPreview);
  grid.input.removeEventListener("focus", updateFormulaPreview);
  grid.input.removeEventListener("blur", updateFormulaPreview);
  grid.hideCellPreview();

  gridWithEditor = undefined;
  handleActiveCellChanged();
  const { rowIndex, columnIndex } = grid.activeCell;
  const valueAfterEdit = grid.dataSource.getCellValue(rowIndex, columnIndex);
  if (valueBeforeEdit != valueAfterEdit) {
    const oldValueMap: Map<string, any> = new Map([
      [getUndoRedoCellKey(rowIndex, columnIndex), valueBeforeEdit],
    ]);
    const newValueMap: Map<string, any> = new Map([
      [getUndoRedoCellKey(rowIndex, columnIndex), valueAfterEdit],
    ]);
    // Add history action for enter value
    addHistoryAction(
      createGridValueAction(
        grid.getSelections(),
        grid.activeCell,
        "ENTER_VALUE",
        oldValueMap,
        newValueMap,
        valueAfterEdit
      ),
      true
    );
  }
}
```

## Macro Function

There are 3 steps we need to add macro for new macro action:

### Step 1

Define state and class of macro action in https://github.com/datadocs/datadocs/tree/main/packages/datadocs/src/components/panels/History/types/macro/actions. Eg: for `Grid action`:
State:

```ts
export class StyleMacroState extends MacroState {
  value: Partial<CellStyleDeclaration>;
  constructor(type: StyleStateType, value: Partial<CellStyleDeclaration>) {
    super(type);
    this.value = value;
  }
}

export class ValueMacroState extends MacroState {
  value: any;
  constructor(type: ValueStateType, value: any) {
    super(type);
    this.value = value;
  }
}

export class MergecellMacroState extends MacroState {
  direction: MergeCellsDirection;
  constructor(type: MergeCellStateType, direction: MergeCellsDirection) {
    super(type);
    this.direction = direction;
  }
}
```

Class of grid macro action:

```ts
export class GridMacroAction extends MacroAction {
  selections: SelectionOffsetDeclarator[];
  activeCell: ActiveCellOffsetDeclarator;
  sheetName: string;
  viewName: string;

  constructor(
    gridState: MacroState,
    selections: SelectionOffsetDeclarator[],
    activeCell: ActiveCellOffsetDeclarator,
    sheetName: string,
    viewName: string
  ) {
    super("GRID", gridState);
    this.selections = selections;
    this.activeCell = activeCell;
    this.sheetName = sheetName;
    this.viewName = viewName;
  }
}
```

### Step 2

Implement convert function from history action to macro action in history. Eg, for `Grid value aciton`:

```ts
  toMacroAction(
    reference: MACRO_ITEM_REFERENCE_TYPE,
    gridActiveCellMap: Map<string, any>
  ): MacroAction[] {
    const redoState = this.redoState as ValueRedoState;
    const currentActiveCell = gridActiveCellMap.get(
      this.gridActiveComponent.activeView.id
    );

    return [
      new GridMacroAction(
        new ValueMacroState(
          redoState.stateType as ValueStateType,
          redoState.value
        ),
        this.getSelectionsOffset(reference, currentActiveCell),
        this.getActiveCellOffset(reference, currentActiveCell),
        this.sheetName,
        this.viewName
      ),
    ];
  }
```

### Step 3:

Define `History action` or `Macro error` to convert from `macro action` to `History action` and perform this action in function `handleMacroAction` in file https://github.com/datadocs/datadocs/blob/main/packages/datadocs/src/app/store/panels/store-history-panel.ts. Eg:

```ts
switch (gridMacro.macroState.stateType) {
  case "ENTER_VALUE": {
    const valueMacroState = gridMacro.macroState as ValueMacroState;
    const oldValueMap: Map<string, any> = new Map([
      [
        getUndoRedoCellKey(activeCell.rowIndex, activeCell.columnIndex),
        grid.dataSource.getCellValue(
          activeCell.rowIndex,
          activeCell.columnIndex
        ),
      ],
    ]);
    const newValueMap: Map<string, any> = new Map([
      [
        getUndoRedoCellKey(activeCell.rowIndex, activeCell.columnIndex),
        valueMacroState.value,
      ],
    ]);
    grid.dataSource.editCells([
      {
        row: activeCell.rowIndex,
        column: activeCell.columnIndex,
        value: valueMacroState.value,
      },
    ]);
    // Add history action for enter value
    return createGridValueAction(
      grid.getSelections(),
      grid.activeCell,
      "ENTER_VALUE",
      oldValueMap,
      newValueMap,
      valueMacroState.value
    );
  }
}
```
