import HandleComponent from './handle-component.js';


export default
class RangeComponent {
  constructor (el, opts) {
    let { start, stop, ...rOpts } = opts;
    Object.assign(this, rOpts);
    if (el) {
      this.el = el;
      this.el.style.position = 'absolute';
    }

    if (start) {
      if (!Array.isArray(start)) start = [start];

      this.start = new HandleComponent(start[0], {
        ...start[1],
        range: this,
      });
      this.start.syncView();
    }

    if (stop) {
      if (!Array.isArray(stop)) stop = [stop];

      this.stop = new HandleComponent(stop[0], {
        ...stop[1],
        range: this,
      });
      this.stop.syncView();
    }
  }

  updateView () {
    if (!this.el) return;

    const startOffset = this.start?.offset ?? 0;
    const stopOffset = this.stop?.offset ?? this.bar.width;
    this.el.style.transform = 'translateX(' + startOffset + 'px)';
    this.el.style.width = Math.max(stopOffset - startOffset, 0);
  }

  destroy () {
    if (this.start) this.start.destroy();
    if (this.stop) this.stop.destroy();
  }

  handleMin (handle) {
    return Math.max(...[
      this.min,
      this.bar.min,
      handle === this.stop && this.start ? this.start.model.value : null,
    ].filter(m => m != null));
  }

  handleMax (handle) {
    return Math.min(...[
      this.max,
      this.bar.max,
      handle === this.start && this.stop ? this.stop.model.value : null,
    ].filter(m => m != null));
  }
}
