/** Save the system console to this variable, because we will export `const console` in below */
const sysConsole = window.console;

/** It is used for the standard methods that current browser's console doesn't support */
const noop: (...args: any[]) => void = () => {};

type ConsoleConfig = {
  off: boolean;
  only: string[];
  skip: string[];
};

class ControlledConsole {
  //#region control methods
  private static storageKey = "datadocs-console-config-v1";
  private static getDefaultConfig = (): ConsoleConfig => ({
    off: false,
    only: [],
    skip: [],
  });

  private currentGroupState: boolean;
  private config = ControlledConsole.getDefaultConfig();

  private loadConifg = () => {
    try {
      const json = localStorage.getItem(ControlledConsole.storageKey);
      if (json) {
        this.config = JSON.parse(json);
        return;
      }
    } catch (error) {
      // noop
    }
    this.config = ControlledConsole.getDefaultConfig();
  };
  private saveConfig = () => {
    try {
      localStorage.setItem(
        ControlledConsole.storageKey,
        JSON.stringify(this.config)
      );
    } catch (error) {
      sysConsole.error(error);
    }
  };

  off = () => {
    this.config.off = true;
    this.saveConfig();
  };
  only = (...keywords: string[]) => {
    this.config.only = keywords;
    this.saveConfig();
  };
  skip = (...keywords: string[]) => {
    this.config.skip.push(...keywords);
    this.saveConfig();
  };
  clearSkip = () => {
    this.config.skip.length = 0;
    this.saveConfig();
  };
  //#endregion control methods

  //#region implement all methods in `console`
  private _bind = (methodName: keyof typeof sysConsole) => {
    const fn = sysConsole[methodName];
    if (typeof fn === "function") return fn.bind(sysConsole);
    return noop;
  };
  private _checkTag = (tag: string) => {
    if (typeof this.currentGroupState === "boolean")
      return this.currentGroupState;

    const { off, only, skip } = this.config;
    if (off) return false;

    if (tag === null || tag === undefined) tag = "";
    else if (typeof tag !== "string") tag = String(tag);

    if (only.length > 0) {
      if (!tag) return false;
      const has = only.findIndex((it) => tag.indexOf(it) >= 0) >= 0;
      if (!has) return false;
    }
    if (skip.length > 0 && tag) {
      const has = skip.findIndex((it) => tag.indexOf(it) >= 0) >= 0;
      if (has) return false;
    }
    return true;
  };
  private _bindWithCondChecker = (methodName: keyof typeof sysConsole) => {
    let fn: any = sysConsole[methodName];
    if (typeof fn !== "function") return noop;
    fn = fn.bind(sysConsole);
    return (...args: any[]) => {
      if (!this._checkTag(args[0])) return;
      fn(...args);
    };
  };

  assert: typeof sysConsole.assert = this._bind("assert");
  clear: typeof sysConsole.clear = this._bind("clear");
  count: typeof sysConsole.count = this._bind("count");
  countReset: typeof sysConsole.countReset = this._bind("countReset");
  debug: typeof sysConsole.debug = this._bindWithCondChecker("debug");
  dir: typeof sysConsole.dir = this._bindWithCondChecker("dir");
  dirxml: typeof sysConsole.dirxml = this._bindWithCondChecker("dirxml");
  error: typeof sysConsole.error = this._bindWithCondChecker("error");
  group = (...labels: string[]) => {
    this.currentGroupState = this._checkTag(labels[0]);
    if (this.currentGroupState) sysConsole.groupCollapsed(...labels);
  };
  groupCollapsed = this.group;
  groupEnd = () => {
    if (this.currentGroupState) sysConsole.groupEnd();
    delete this.currentGroupState;
  };
  info: typeof sysConsole.info = this._bindWithCondChecker("info");
  log: typeof sysConsole.log = this._bindWithCondChecker("log");
  table: typeof sysConsole.table = this._bindWithCondChecker("table");
  time: typeof sysConsole.time = this._bind("time");
  timeEnd: typeof sysConsole.timeEnd = this._bind("timeEnd");
  timeLog: typeof sysConsole.timeLog = this._bind("timeLog");
  trace: typeof sysConsole.trace = this._bindWithCondChecker("trace");
  warn: typeof sysConsole.warn = this._bindWithCondChecker("warn");
  profile: typeof sysConsole.profile = this._bindWithCondChecker("profile");
  profileEnd: typeof sysConsole.profileEnd =
    this._bindWithCondChecker("profileEnd");
  timeStamp: typeof sysConsole.timeStamp =
    this._bindWithCondChecker("timeStamp");
  //#endregion implement all methods in `console`

  constructor() {
    this.loadConifg();
  }
}

let _console: ControlledConsole;
if (window["controlledConsole"]) _console = window["controlledConsole"];
else window["controlledConsole"] = _console = new ControlledConsole();
export const console = _console;
