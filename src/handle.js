import PubSub from './utils/pubsub.js';
import { bound } from './utils/fn.js';


export default
class Handle extends PubSub {
  constructor (opts) {
    super();
    this._valueChanges = [];
    Object.assign(this, Handle.DEFAULTS, opts);
  }

  get value () {
    return this._value;
  }

  set value (v) {
    if (this.value === v) return;

    this._valueChanges.push(this.value);

    this._value = bound(this.min, v, this.max);
    this.emit('verify', this.value, this);

    const oldValue = this._valueChanges.pop();

    if (!this._valueChanges.length && this.value !== oldValue) {
      this.emit('change', this.value, this);
    }
  }
}
Handle.DEFAULTS = {
  value: 0,
};
