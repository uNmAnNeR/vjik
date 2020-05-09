import Vjik from './vjik.js';
import { bound } from './utils/fn.js';


const LEFT_KEY = 37;
const UP_KEY = 38;
const RIGHT_KEY = 39;
const DOWN_KEY = 40;

export default
class Handle {
  constructor (opts) {
    this._onKeyDown = this._onKeyDown.bind(this);
    this._valueChanges = [];

    this.update({ ...Handle.DEFAULTS, ...opts });
  }

  update (opts) {
    const oldEl = this.el;
    const { value, ...restOpts } = opts;
    Object.assign(this, restOpts);

    if (oldEl !== this.el) {
      this.destroy();

      if (this.el) {
        this.el.style.position = 'absolute';
        if (this.el.tabIndex === -1) this.el.tabIndex = '-1';
        this._originalTransform = window.getComputedStyle(this.el).transform;
        if (this._originalTransform === 'none') this._originalTransform = '';
        this.bindEvents();
      }
    }

    this.value = value ?? this.value;
    this.updateView();
  }

  updateView () {
    if (!this.el) return;

    this.el.style.transform = `${this._originalTransform} translateX(${this.offset}px) translateX(-50%)`;
    this._onMove();
  }

  get isDragging () {
    return this._isActive;
  }

  set isDragging (isDragging) {
    this._isActive = isDragging;
    if (isDragging) {
      this._originalTransition = this.el.style.transition;
      this.el.style.transition = 'none';
      this._onStartMove();
      if (this.el) this.el.focus();
    } else {
      this.el.style.transition = this._originalTransition;
      this._onEndMove();
    }
  }

  get value () {
    return this._value;
  }

  set value (v) {
    if (this.transform) v = this.transform(v, this);
    v = bound(
      this.bar.stepAligned(this.minValue, Vjik.ALIGN_DIRECTION.RIGHT),
      this.bar.stepAligned(v),
      this.bar.stepAligned(this.maxValue, Vjik.ALIGN_DIRECTION.LEFT),
    );
    if (this.value === v) return;

    this._valueChanges.push(this.value);

    this._value = v;
    this.bar._verifyHandle(this);

    const oldValue = this._valueChanges.pop();

    if (!this._valueChanges.length && this.value !== oldValue) {
      this._onChange();
      this.bar._onHandleChange(this);
    }
  }

  get canBeMoved () {
    return this.minValue < this.value || this.value < this.maxValue && !this.disabled;
  }

  get position () {
    return this.isDragging ?
      this._position :
      this.bar.valueToPosition(this.value);
  }

  set position (p) {
    p = bound(this.minPosition, p, this.maxPosition);
    if (this.isDragging) this._position = p;
    this.value = this.bar.positionToValue(p);
    this.updateView();
  }

  get minValue () {
    return Math.max(...[
      this.min,
      this.bar.handleMin(this),
    ].filter(v => v != null));
  }

  get maxValue () {
    return Math.min(...[
      this.max,
      this.bar.handleMax(this),
    ].filter(v => v != null));
  }

  get minPosition () {
    const minVal = this.minValue;
    return minVal != null ? this.bar.valueToPosition(minVal) : null;
  }

  get maxPosition () {
    const maxVal = this.maxValue;
    return maxVal != null ? this.bar.valueToPosition(maxVal) : null;
  }

  get offset () {
    return this.position * this.bar.width;
  }

  canGetCloserToPosition (p) {
    return bound(this.minPosition, p, this.maxPosition) !== this.position;
  }

  disable () {
    this.disabled = true;
  }

  enable () {
    this.disabled = false;
  }

  _onKeyDown (e) {
    if (e.keyCode < LEFT_KEY || DOWN_KEY < e.keydown) return;
    e.preventDefault();

    if (e.keyCode === RIGHT_KEY || e.keyCode === UP_KEY) this.value += this.bar.keydownStep;
    if (e.keyCode === LEFT_KEY || e.keyCode === DOWN_KEY) this.value -= this.bar.keydownStep;
  }

  bindEvents () {
    this.el.addEventListener('keydown', this._onKeyDown);
  }

  unbindEvents () {
    this.el.removeEventListener('keydown', this._onKeyDown);
  }

  sync () {
    this.value = this.value;
    this.updateView();
  }

  destroy () {
    if (!this.el) return;

    this.unbindEvents();
    this.el.style.transform = this._originalTransform;
  }

  // Events
  _onChange () {
    if (this.onChange) this.onChange(this._value, this);
    if (!this.isDragging) this.updateView();
  }

  _onVerify () {
    if (this.onVerify) this.onVerify(this.value, this);
  }

  _onMove () {
    this.bar._onHandleMove(this);
    if (this.onMove) this.onMove(this.value, this);
  }

  _onStartMove () {
    if (this.onStartMove) this.onStartMove(this.value, this);
  }

  _onEndMove () {
    this.position = this.bar.valueToPosition(this.value);
    this.updateView();
    if (this.onEndMove) this.onEndMove(this.value, this);
  }
}
Handle.DEFAULTS = {
  value: 0,
};

Vjik.Handle = Handle;
