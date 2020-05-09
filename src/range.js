import Vjik from './vjik.js';
import Handle from './handle.js';


export default
class Range {
  constructor (opts) {
    this.updateView = this.updateView.bind(this);

    this.update(opts);
  }

  sync () {
    this._synchronizing = true;
    if (this.startComponent) this.startComponent.sync();
    if (this.stopComponent) this.stopComponent.sync();
    this._synchronizing = false;
  }

  update (opts) {
    const oldEl = this.el;
    Object.assign(this, opts);

    if (oldEl !== this.el) {
      this.destroy();

      if (this.el) {
        this.el.style.position = 'absolute';
        this._originalTransform = window.getComputedStyle(this.el).transform;
        if (this._originalTransform === 'none') this._originalTransform = '';
      }
    }
  }

  get startComponent () {
    if (!this.start) return;

    return this.start instanceof Handle ?
      this.start :
      this.bar.handle(this.start);
  }

  get stopComponent () {
    if (!this.stop) return;

    return this.stop instanceof Handle ?
      this.stop :
      this.bar.handle(this.stop);
  }

  updateView () {
    if (!this.el) return;

    const startOffset = this.startComponent?.offset ?? 0;
    const stopOffset = this.stopComponent?.offset ?? this.bar.width;
    this.el.style.transform = `${this._originalTransform} translateX(${startOffset}px)`;
    this.el.style.width = `${Math.max(stopOffset - startOffset, 0)}px`;
  }

  destroy () {
    if (this.el) {
      this.el.style.transform = this._originalTransform;
      this.el.style.width = '';
    }
  }

  handleMin (handle) {
    return Math.max(...[
      this.min,
      (handle === this.stopComponent ? (this.startComponent?.value ?? null) : null),
    ].filter(m => m != null));
  }

  handleMax (handle) {
    return Math.min(...[
      this.max,
      (!this._synchronizing && handle === this.startComponent ? (this.stopComponent?.value ?? null) : null),
    ].filter(m => m != null));
  }

  containsHandle (handle) {
    return this.startComponent === handle || this.stopComponent === handle;
  }

  _onChange () {
    if (this.onChange) this.onChange({
      start: this.startComponent?.value,
      stop: this.stopComponent?.value,
    }, this);
  }

  _verifyHandle (h) {
    const vh = h === this.startComponent ? this.stopComponent : this.startComponent;

    vh.value = vh.value;
  }
}


Vjik.Range = Range;
