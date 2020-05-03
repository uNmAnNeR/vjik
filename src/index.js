export { default as Handle } from './handle.js';
export { default as Range } from './range.js';
export { default as Bar } from './bar.js';

import Vjik from './vjik.js';


try {
  globalThis.Vjik = Vjik;
} catch (e) {}
