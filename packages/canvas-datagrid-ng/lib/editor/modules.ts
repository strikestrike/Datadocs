import type { EditorModuleLoader, EditorElement } from './type';
import keyboarCommand from './keyboard-command';
import core from './core';
import selection from './selection';
import elementFunctions from './utils';
import history from './history';
import hyperlink from './hyperlink';

export const editorModules: EditorModuleLoader[] = [
  keyboarCommand,
  core,
  elementFunctions,
  history,
  selection,
  hyperlink,
];

export function loadAllEditorModules(editor: EditorElement) {
  editorModules.forEach(function (module) {
    module(editor);
  });
}
