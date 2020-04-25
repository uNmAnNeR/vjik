export { default as Handle } from './handle.js';
export { default as HandleComponent } from './handle-component.js';
export { default as RangeComponent } from './range-component.js';
export { default as BarComponent } from './bar-component.js';

import BarComponent from './bar-component.js';


export default
function Vjik (...args) {
  return new BarComponent(...args);
}

try {
  globalThis.Vjik = Vjik;
} catch (e) {}
