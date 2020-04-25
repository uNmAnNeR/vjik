import RangeComponent from './range-component.js';


export default
class BarComponent {
  constructor (el, opts) {
    this.onStartMove = this.onStartMove.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onEndMove = this.onEndMove.bind(this);

    this.el = el;
    if (this.el) {
      this.el.style.position = 'relative';
      BarComponent.START_EVENTS.forEach(ev => this.el.addEventListener(ev, this.onStartMove));
    }

    let { range=[], start, stop, ...barOpts } = opts;
    Object.assign(this, BarComponent.DEFAULTS, barOpts);

    if (Array.isArray(range)) {
      if (!Array.isArray(range[0])) {
        range = [range];
      }
    } else {
      range = [[undefined, range]];
    }

    this.ranges = range.map(([el, pOpts={}]) => new RangeComponent(el, {
      bar: this,
      start,
      stop,
      ...pOpts,
    }));
  }

  get handles () {
    return [].concat(...this.ranges.map(r => [r.start, r.stop])).filter(Boolean);
  }

  _isEventOnElement (e, el) {
    const ebox = el.getBoundingClientRect();
    const mx = (e.touches && e.touches.length) ? e.touches[0].pageX : e.pageX;
    const my = (e.touches && e.touches.length) ? e.touches[0].pageY : e.pageY;

    return ebox.left <= mx &&
      ebox.right >= mx &&
      ebox.top <= my &&
      ebox.bottom >= my;
  }

  onStartMove (e) {
    // prevent default to disable text selection, etc...
    e.preventDefault();
    // TODO support multitouch! but currently just disable
    this.unbindChangeEvents();

    const startOffset = this._getEventOffset(e);
    const startPosition = startOffset / this.width;
    const [nearestHandle, moveOffset] = this.handles.reduce(([nearest, nearestDist], h) => {
      const hDist = startOffset - h.offset;
      return ((!nearest || Math.abs(nearestDist) > Math.abs(hDist)) && h.canBeMoved &&
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
    this.activeHandle.position = (this._getEventOffset(e) - this._moveOffset) / this.width;
  }

  get width () {
    return this.el.getBoundingClientRect().width;
  }

  get length () {
    return this.max - this.min;
  }

  get activeHandle () {
    return this.handles.find(h => h.isActive);
  }

  onEndMove (e) {
    e.preventDefault();
    this.activeHandle.isActive = false;
    this.unbindChangeEvents();
  }

  bindChangeEvents () {
    BarComponent.MOVE_EVENTS.forEach(ev => document.body.addEventListener(ev, this.onMove));
    BarComponent.END_EVENTS.forEach(ev => document.body.addEventListener(ev, this.onEndMove));
  }

  unbindChangeEvents () {
    BarComponent.MOVE_EVENTS.forEach(ev => document.body.removeEventListener(ev, this.onMove));
    BarComponent.END_EVENTS.forEach(ev => document.body.removeEventListener(ev, this.onEndMove)); 
  }

  destroy () {
    this.ranges.forEach(r => r.destroy());
  }
}
BarComponent.START_EVENTS = ['mousedown', 'touchstart', 'pointerdown'];
BarComponent.MOVE_EVENTS = ['mousemove', 'touchmove', 'pointermove'];
BarComponent.END_EVENTS = ['mouseup', 'touchend', 'pointerup'];
BarComponent.DEFAULTS = {
  keydownStep: 1,
  min: 0,
  max: 100,
};