/* KeyboardCommands Options */

import { copyMethods, isMetaCtrlKey } from '../util';
import type { EditorElement } from './type';

/* commands: [Array]
 * Array of objects describing each command and the combination of keys that will trigger it
 * Required for each object:
 *   command [String] (argument passed to editor.execAction())
 *   key [String] (keyboard character that triggers this command)
 *   meta [boolean] (whether the ctrl/meta key has to be active or inactive)
 *   shift [boolean] (whether the shift key has to be active or inactive)
 *   alt [boolean] (whether the alt key has to be active or inactive)
 */
interface KeyboardCommand {
  command: string;
  key: string;
  meta: boolean;
  shift: boolean;
  alt: boolean;
}

const commands: KeyboardCommand[] = [
  {
    command: 'bold',
    key: 'b',
    meta: true,
    shift: false,
    alt: false,
  },
  {
    command: 'italic',
    key: 'i',
    meta: true,
    shift: false,
    alt: false,
  },
  {
    command: 'strikethrough',
    key: 'x',
    meta: true,
    shift: true,
    alt: false,
  },
  {
    command: 'undo',
    key: 'z',
    meta: true,
    shift: false,
    alt: false,
  },
  {
    command: 'redo',
    key: 'z',
    meta: true,
    shift: true,
    alt: false,
  },
  {
    command: 'selectAll',
    key: 'a',
    meta: true,
    shift: false,
    alt: false,
  },
];

export default function loadEditorKeyboardCommand(self: EditorElement) {
  copyMethods(new EditorKeyBoardCommand(self), self);
}

export class EditorKeyBoardCommand {
  keys: { [key: string]: KeyboardCommand[] } = null;

  constructor(private readonly editor: EditorElement) {
    this.keys = {};

    commands.forEach(function (command) {
      const key = command.key;
      if (!this.keys[key]) {
        this.keys[key] = [];
      }
      this.keys[key].push(command);
    }, this);
  }

  handleKeydown = (event: KeyboardEvent, notIncludeHistory: boolean) => {
    const self = this.editor;
    const key = event.key;
    self.updateSelection(false);

    // Make sure to dispatch 'editorselectionchange' on arrow key, because
    // caret position has changed
    const selectionChanged = isArrowKey(key);
    if (selectionChanged) {
      setTimeout(() => {
        self.updateSelection(selectionChanged);
      });
    }

    if (!this.keys[key]) {
      return;
    }

    const isMeta = isMetaCtrlKey(event),
      isShift = !!event.shiftKey,
      isAlt = !!event.altKey;

    this.keys[key].forEach(function (data) {
      if (
        data.meta === isMeta &&
        data.shift === isShift &&
        (data.alt === isAlt || undefined === data.alt)
      ) {
        if (
          !notIncludeHistory ||
          (data.command != 'undo' &&
            data.command != 'redo' &&
            data.command != 'selectAll')
        ) {
          // TODO deprecated: remove check for undefined === data.alt when jumping to 6.0.0
          event.preventDefault();
          event.stopPropagation();

          // command can be false so the shortcut is just disabled
          if (data.command) {
            self.execAction(data.command, null);
          }
        }
      }
    }, this);
  };

  /**
   * Define which key is supported in editor readonly mode
   * @param event
   * @returns
   */
  isReadonlyAllowKey = (event: KeyboardEvent): boolean => {
    const key = event.key;
    const isMeta = isMetaCtrlKey(event),
      isShift = !!event.shiftKey,
      isAlt = !!event.altKey;

    // Allow arrow key to control cursor and select text
    if (isArrowKey(key)) {
      return true;
    }

    // Allow custom command to work such as select all, undo/redo, etc.
    if (this.keys[key]) {
      for (let i = 0; i < this.keys[key].length; i++) {
        const data = this.keys[key][i];

        if (
          data.meta === isMeta &&
          data.shift === isShift &&
          (data.alt === isAlt || undefined === data.alt)
        ) {
          return true;
        }
      }
    }

    // Allow copy to function properly in editor readonly mode
    if (isMeta && key.toLowerCase() === 'c') {
      return true;
    }

    return false;
  };

  isHistoryAction = (event: KeyboardEvent): boolean => {
    const key = event.key;
    if (!this.keys[key]) {
      return false;
    }
    const isMeta = isMetaCtrlKey(event),
      isShift = !!event.shiftKey,
      isAlt = !!event.altKey;
    for (const data of this.keys[key]) {
      if (
        data.meta === isMeta &&
        data.shift === isShift &&
        (data.alt === isAlt || undefined === data.alt)
      ) {
        if (data.command === 'undo' || data.command === 'redo') {
          return true;
        }
      }
    }
    return false;
  };
}

function isArrowKey(key: string) {
  return (
    key === 'ArrowDown' ||
    key === 'ArrowUp' ||
    key === 'ArrowLeft' ||
    key === 'ArrowRight'
  );
}
