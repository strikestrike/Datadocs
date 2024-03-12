// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { GridInternalState } from '../state';
import type { GridPrivateProperties } from '../types/grid';
import { copyMethods } from '../util';
import { copyGetterSetter } from '../utils/object-props';

export default function loadGridDerivedState(self: GridPrivateProperties) {
  const derivedState = new GridDerivedState(self);
  copyMethods(derivedState, self);
  copyGetterSetter(self, GridDerivedState.prototype, derivedState);
}

export class GridDerivedState {
  constructor(private readonly state: GridPrivateProperties) {}

  /**
   * This is a reserved value for rendering loading indicator(rotating ring) that
   * convers the entire the grid
   */
  get loading(): boolean {
    if (!this.state.dataSource) return false;
    const st = this.state.dataSource.state;
    return st ? st.loading : false;
  }

  // @todo: this is a transition way to delegate the `sizes` with less code modification
  get sizes() {
    return this.state.dataSource.sizes;
  }

  /**
   * Returns the current value of the editing input.
   * @see GridInternalState.input
   */
  get inputValue() {
    const state = this.state;
    if (!state.input) return;

    if (state.input instanceof HTMLDivElement) {
      return state.input.textContent;
    }
    return state.input.value;
  }

  /**
   * Sets the current value of the editing input.
   * @see GridInternalState.input
   */
  set inputValue(value: string) {
    const state = this.state;
    if (!state.input) return;
    if (state.input instanceof HTMLDivElement) {
      if (!value) {
        state.input.innerHTML = '';
        return;
      }

      const contentElement = document.createElement('span');
      contentElement.textContent = value;

      state.input.innerHTML = '';
      state.input.appendChild(contentElement);
    } else {
      state.input.value = value;
    }
  }
}
