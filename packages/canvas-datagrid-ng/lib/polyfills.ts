/**
 * This file is used for the demo server
 * dist/polyfills.mjs
 */
import { Buffer } from 'buffer';
window.Buffer = Buffer;
//@ts-ignore
window.process = {
  env: {},
};
