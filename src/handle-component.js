import { bound } from './utils/fn.js';
import Handle from './handle.js';


const LEFT_KEY = 37;
const UP_KEY = 38;
const RIGHT_KEY = 39;
const DOWN_KEY = 40;


export default
class HandleComponent {
  constructor (el, opts) {
    this._onVerify = this._onVerify.bind(this);
    this._onChange = this._onChange.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    this.el = el;
    this.el.style.position = 'absolute';
    if (this.el.tabIndex === -1) this.el.tabIndex = '-1';
    this._originalTransform = window.getComputedStyle(this.el).transform;
    const { range, onChange, ...hOpts } = opts;
    this.range = range;
    this.onChange = onChange;
    this.model = new Handle(hOpts);

    this.bindEvents();
    this._updateElementPosition();
  }

  _updateElementPosition () {
    this.el.style.transform = `${this._originalTransform} translateX(${this.offset}px) translateX(-50%)`;
    this.range.updateView();
  }

  get bar () { return this.range.bar; }

  get isActive () {
    return this._isActive;
  }

  set isActive (isActive) {
    this._isActive = isActive;
    if (isActive) this.el.focus();
  }

  get value () { return this.model.value; }
  set value (val) { this.model.value = bound(this.min, val, this.max); }

  get canBeMoved () {
    return this.min < this.value || this.value < this.max;
  }

  get position () {
    return this.isActive ?
      this._position :
      this.bar.valueToPosition(this.value);
  }

  set position (p) {
    p = bound(this.minPosition, p, this.maxPosition);
    if (this.isActive) this._position = p;
    this.value = this.bar.positionToValue(p);
    this._updateElementPosition();
  }

  get min () {
    return Math.max(...[
      this.model.min,
      this.range.handleMin(this),
    ].filter(v => v != null));
  }

  get max () {
    return Math.min(...[
      this.model.max,
      this.range.handleMax(this),
    ].filter(v => v != null));
  }

  get minPosition () {
    const minVal = this.min;
    return minVal != null ? this.bar.valueToPosition(minVal) : null;
  }

  get maxPosition () {
    const maxVal = this.max;
    return maxVal != null ? this.bar.valueToPosition(maxVal) : null;
  }

  get offset () {
    return this.position * this.bar.width;
  }

  canGetCloserToPosition (p) {
    return bound(this.minPosition, p, this.maxPosition) !== this.position;
  }

  _onVerify (val) {
    this.value = val;
  }

  _onChange (val) {
    if (this.onChange) this.onChange(val, this);
    if (!this.isActive) this._updateElementPosition();
  }

  _onKeyDown (e) {
    if (e.keyCode < LEFT_KEY || DOWN_KEY < e.keydown) return;
    e.preventDefault();

    if (e.keyCode === RIGHT_KEY || e.keyCode === UP_KEY) this.value += this.bar.keydownStep;
    if (e.keyCode === LEFT_KEY || e.keyCode === DOWN_KEY) this.value -= this.bar.keydownStep;
  }

  bindEvents () {
    this.model.on('verify', this._onVerify);
    this.model.on('change', this._onChange);
    this.el.addEventListener('keydown', this._onKeyDown);
  }

  unbindEvents () {
    this.model.off('verify', this._onVerify);
    this.model.off('change', this._onChange);
    this.el.removeEventListener('keydown', this._onKeyDown);
  }

  syncView () {
    this.value = this.model.value;
    this._updateElementPosition();
  }

  destroy () {
    this.unbindEvents();
    this.el.style.transform = this._originalTransform;
  }
}
