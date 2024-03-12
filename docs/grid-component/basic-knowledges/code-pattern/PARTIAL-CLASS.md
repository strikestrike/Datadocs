TODO:

Explain how multiple grid classes work with each other ...

1. About the typescript class
2. How we do
3. What caveats you should know


``` typescript
type GridPartialClassInitArg1 = GridState;
type GridPartialClassInitArg2 = GridUtils &
  GridEventHandler &
  GridSelectionManager;

class GridState {
  data: any[];
  styles?: any;
}

class GridUtils {
  constructor(
    state: GridPartialClassInitArg1,
    grid: GridPartialClassInitArg2,
  ) {}
  getLayerPos = (e: { x: number; y: number }) => {};
}

class GridEventHandler {
  constructor(
    state: GridPartialClassInitArg1,
    grid: GridPartialClassInitArg2,
  ) {}
}

class GridSelectionManager {
  constructor(
    readonly state: GridPartialClassInitArg1,
    readonly grid: GridPartialClassInitArg2,
  ) {}
  clearSelection = () => {
    // "Go to definition" on the following statement can works well
    this.grid.getLayerPos({ x: 1, y: 2 });
  };
}

type Grid = {
  state: GridState;
} & Pick<
  GridUtils & GridEventHandler & GridSelectionManager,
  'getLayerPos' | 'clearSelection'
>;

//@ts-ignore
function createGrid(args?: any) {
  const state = new GridState();
  const grid: Grid = { state } as any;
  const props = {} as GridPartialClassInitArg2;
  const modules = [GridUtils, GridEventHandler, GridSelectionManager];
  for (let i = 0; i < modules.length; i++) {
    const Mod = modules[i];
    const instance = new Mod(state, props);
    Object.keys(instance).forEach((key) => {
      const prop = instance[key];
      if (typeof prop === 'function') props[key] = prop.bind(instance);
    });
  }
  Object.assign(grid, props);
  return grid;
}

const grid = createGrid();
// "Go to definition" on the following statement can works well
grid.getLayerPos({ x: 1, y: 1 });

```
