import Vjik from './vjik.js';
import Range from './range.js';
import Handle from './handle.js';


export default
class Bar {
  constructor (opts) {
    this._onStartDrag = this._onStartDrag.bind(this);
    this._onDrag = this._onDrag.bind(this);
    this._onEndDrag = this._onEndDrag.bind(this);
    this.updateView = this.updateView.bind(this);

    this.handleComponents = [];
    this.handleRefs = {};

    this.rangeComponents = [];
    this.rangeRefs = {};

    this.update({ ...Bar.DEFAULTS, ...opts });
  }

  update (opts) {
    // TODO save and restore state
    this.destroy();

    Object.assign(this, opts);

    if (this.el) {
      const position = window.getComputedStyle(this.el).position;
      if (!position || position === 'static') this.el.style.position = 'relative';
      Vjik.DRAG_START_EVENTS.forEach(ev => this.el.addEventListener(ev, this._onStartDrag));
      window.addEventListener('resize', this.updateView);
    }

    // handles
    let handles = this.handles;

    if (Array.isArray(handles)) {
      handles = handles.map(h => [undefined, h]);
    } else {
      handles = Object.entries(handles);
    }

    this.handleComponents = handles.map(([key, opts={}]) => {
      const h = new Handle({
        bar: this,
        ...opts,
      });

      if (key) this.handleRefs[key] = h;

      return h;
    });

    // ranges
    let ranges = this.ranges;

    if (Array.isArray(ranges)) {
      ranges = ranges.map(r => [undefined, r]);
    } else {
      ranges = Object.entries(ranges);
    }

    this.rangeComponents = ranges.map(([key, opts={}]) => {
      const r = new Range({
        bar: this,
        ...opts,
      });

      if (key) this.rangeRefs[key] = r;

      return r;
    });

    this.rangeComponents.forEach(c => c.sync());
  }

  touchedHandles (e) {
    const dx = e.touches?.[0]?.pageX ?? e.pageX;
    const dy = e.touches?.[0]?.pageY ?? e.pageY;

    const touchedElements = document.elementsFromPoint(dx, dy);
    const barIdx = touchedElements.indexOf(this.el);

    return touchedElements.slice(0, barIdx).map(te => this.handleComponents.find(h => h.el === te)).filter(Boolean);
  }

  _onStartDrag (e) {
    // prevent default to disable text selection, etc...
    e.preventDefault();
    // TODO support multitouch! but currently just disable
    this.unbindChangeEvents();

    if (this.disabled) return;

    const startOffset = this._getEventOffset(e);

    const touchedHandles = this.touchedHandles(e);
    let nearestHandle = touchedHandles.filter(h => h.canBeMoved)[0];
    const isOnElement = Boolean(nearestHandle);
    if (!nearestHandle) {
      const startPosition = startOffset / this.size;

      ([nearestHandle] = this.handleComponents.reduce(([nearest, nearestDist], h) => {
        const hDist = startOffset - h.offset;
        return ((!nearest || Math.abs(nearestDist) > Math.abs(hDist)) &&
          !touchedHandles.includes(h) && h.canBeMoved && h.canGetCloserToPosition(startPosition)
        ) ?
          [h, hDist] :
          [nearest, nearestDist];
      }, []));
    }

    if (!nearestHandle) return;

    this.bindChangeEvents();
    this._moveOffset = isOnElement ? startOffset - nearestHandle.offset : 0;
    nearestHandle.isDragging = true;
    if (!isOnElement) this._onDrag(e);
  }

  _getEventOffset (e) {
    const ebox = this.el.getBoundingClientRect();

    // TODO handle more then one touch
    return this.vertical ?
      (ebox.bottom - (e.touches?.[0]?.clientY ?? e.clientY)) :
      ((e.touches?.[0]?.pageX ?? e.pageX) - ebox.left);
  }

  positionToValue (p) {
    return this.min + p * this.length;
  }

  valueToPosition (v) {
    return (v - this.min) / this.length;
  }

  get stepPrecision () {
    if (!this.step) return 0;

    return String(this.step).split('.')[1]?.length ?? 0;
  }

  stepAligned (v, direction=Vjik.ALIGN_DIRECTION.NONE) {
    if (!this.step) return v;

    let aligned = Number((Math.round(v / this.step) * this.step).toFixed(this.stepPrecision));
    if (direction === Vjik.ALIGN_DIRECTION.LEFT && v < aligned) aligned -= this.step;
    else if (direction === Vjik.ALIGN_DIRECTION.RIGHT && v > aligned) aligned += this.step;

    return aligned;
  }

  _onDrag (e) {
    e.preventDefault();
    if (this.disabled || this.draggingHandle.disabled) return this._onEndDrag(e);
    this.draggingHandle.position = (this._getEventOffset(e) - this._moveOffset) / this.size;
  }

  get size () {
    if (!this.el) return 0;

    const rect = this.el.getBoundingClientRect();
    return this.vertical ? rect.height : rect.width;
  }

  get length () {
    return this.max - this.min;
  }

  get draggingHandle () {
    return this.handleComponents.find(h => h.isDragging);
  }

  _onEndDrag (e) {
    e.preventDefault();
    this.draggingHandle.isDragging = false;
    this.unbindChangeEvents();
  }

  bindChangeEvents () {
    Vjik.DRAG_MOVE_EVENTS.forEach(ev => document.body.addEventListener(ev, this._onDrag));
    Vjik.DRAG_END_EVENTS.forEach(ev => document.body.addEventListener(ev, this._onEndDrag));
  }

  unbindChangeEvents () {
    Vjik.DRAG_MOVE_EVENTS.forEach(ev => document.body.removeEventListener(ev, this._onDrag));
    Vjik.DRAG_END_EVENTS.forEach(ev => document.body.removeEventListener(ev, this._onEndDrag));
  }

  destroy () {
    if (this.el) {
      Vjik.DRAG_START_EVENTS.forEach(ev => this.el.removeEventListener(ev, this._onStartDrag));
    }
    window.removeEventListener('resize', this.updateView);
    this.handleComponents.forEach(h => h.destroy());
    this.rangeComponents.forEach(r => r.destroy());
  }

  handle (key) {
    if (key == null) return;

    return this.handleRefs[key];
  }

  range (key) {
    if (key == null) return;

    return this.rangeRefs[key];
  }

  handleMin (h) {
    return Math.max(...[
      this.min,
      ...this.rangesWithHandle(h).map(rc => rc.handleMin(h)),
    ].filter(m => m != null));
  }

  handleMax (h) {
    return Math.min(...[
      this.max,
      ...this.rangesWithHandle(h).map(rc => rc.handleMax(h)),
    ].filter(m => m != null));
  }

  disable () {
    this.disabled = true;
  }

  enable () {
    this.disabled = false;
  }

  rangesWithHandle (h) {
    return this.rangeComponents.filter(rc => rc.containsHandle(h));
  }

  _onHandleMove (h) {
    this.rangesWithHandle(h).forEach(rc => rc.updateView());
  }

  _onHandleChange (h) {
    this.rangesWithHandle(h).forEach(rc => rc._onChange());
  }

  _verifyHandle (h) {
    this.rangesWithHandle(h).forEach(rc => rc._verifyHandle(h));
  }

  updateView () {
    this.handleComponents.forEach(h => h.updateView());
    this.rangeComponents.forEach(r => r.updateView());
  }
}
Bar.DEFAULTS = {
  handles: [],
  ranges: [],
  keydownStep: 1,
  min: 0,
  max: 100,
};

Vjik.Bar = Bar;
