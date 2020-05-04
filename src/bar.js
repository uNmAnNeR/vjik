import Vjik from './vjik.js';
import Range from './range.js';
import Handle from './handle.js';


export default
class Bar {
  constructor (opts) {
    this.onStartMove = this.onStartMove.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onEndMove = this.onEndMove.bind(this);
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
      Bar.START_EVENTS.forEach(ev => this.el.addEventListener(ev, this.onStartMove));
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

  _isEventOnElement (e, el) {
    return e.target === el || el.contains(e.target);
  }

  onStartMove (e) {
    // prevent default to disable text selection, etc...
    e.preventDefault();
    // TODO support multitouch! but currently just disable
    this.unbindChangeEvents();

    if (this.disabled) return;

    const startOffset = this._getEventOffset(e);
    const startPosition = startOffset / this.width;
    const [nearestHandle, moveOffset] = this.handleComponents.reduce(([nearest, nearestDist], h) => {
      const hDist = startOffset - h.offset;
      return ((!nearest || Math.abs(nearestDist) > Math.abs(hDist)) && h.canBeMoved && !h.disabled &&
        (this._isEventOnElement(e, h.el) || h.canGetCloserToPosition(startPosition))) ?
        [h, hDist] :
        [nearest, nearestDist];
    }, []);
    if (!nearestHandle) return;

    nearestHandle.isActive = true;
    this.bindChangeEvents();

    if (this._isEventOnElement(e, nearestHandle.el)) {
      this._moveOffset = moveOffset;
    } else {
      this._moveOffset = 0;
      this.onMove(e);
    }
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

  onMove (e) {
    e.preventDefault();
    if (this.disabled || this.activeHandle.disabled) return this.onEndMove(e);
    this.activeHandle.position = (this._getEventOffset(e) - this._moveOffset) / this.width;
  }

  get width () {
    return this.el ? this.el.getBoundingClientRect().width : 0;
  }

  get length () {
    return this.max - this.min;
  }

  get activeHandle () {
    return this.handleComponents.find(h => h.isActive);
  }

  onEndMove (e) {
    e.preventDefault();
    this.activeHandle.isActive = false;
    this.unbindChangeEvents();
  }

  bindChangeEvents () {
    Bar.MOVE_EVENTS.forEach(ev => document.body.addEventListener(ev, this.onMove));
    Bar.END_EVENTS.forEach(ev => document.body.addEventListener(ev, this.onEndMove));
  }

  unbindChangeEvents () {
    Bar.MOVE_EVENTS.forEach(ev => document.body.removeEventListener(ev, this.onMove));
    Bar.END_EVENTS.forEach(ev => document.body.removeEventListener(ev, this.onEndMove)); 
  }

  destroy () {
    if (this.el) {
      Bar.START_EVENTS.forEach(ev => this.el.removeEventListener(ev, this.onStartMove));
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

  updateView () {
    this.handleComponents.forEach(h => h.updateView());
    this.rangeComponents.forEach(r => r.updateView());
  }
}
Bar.START_EVENTS = ['mousedown', 'touchstart', 'pointerdown'];
Bar.MOVE_EVENTS = ['mousemove', 'touchmove', 'pointermove'];
Bar.END_EVENTS = ['mouseup', 'touchend', 'pointerup'];
Bar.DEFAULTS = {
  handles: [],
  ranges: [],
  keydownStep: 1,
  min: 0,
  max: 100,
};

Vjik.Bar = Bar;
