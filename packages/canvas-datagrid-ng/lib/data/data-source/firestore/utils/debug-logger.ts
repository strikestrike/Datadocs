export class FirestoreDebugLogger {
  static enabled = true;
  log = (...msg: any[]) =>
    FirestoreDebugLogger.enabled && console.log(this.category, ...msg);
  error = (...msg: any[]) =>
    FirestoreDebugLogger.enabled && console.error(this.category, ...msg);
  warn = (...msg: any[]) =>
    FirestoreDebugLogger.enabled && console.warn(this.category, ...msg);
  info = (...msg: any[]) =>
    FirestoreDebugLogger.enabled && console.info(this.category, ...msg);
  debug = (...msg: any[]) =>
    FirestoreDebugLogger.enabled && console.debug(this.category, ...msg);
  constructor(private readonly category: string) {}
}
