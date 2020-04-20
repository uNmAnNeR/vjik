export default
class PubSub {
  constructor () {
    this._listeners = {};
  }

  on (ev, handler) {
    if (!this._listeners[ev]) this._listeners[ev] = [];
    this._listeners[ev].push(handler);
    return this;
  }

  off (ev, handler) {
    if (!this._listeners[ev]) return this;
    if (!handler) {
      delete this._listeners[ev];
      return this;
    }
    const hi = this._listeners[ev].indexOf(handler);
    if (hi >= 0) this._listeners[ev].splice(hi, 1);
    return this;
  }

  emit (ev, ...args) {
    const listeners = this._listeners[ev];
    if (!listeners) return;

    listeners.forEach(l => l(...args));
  }
}
