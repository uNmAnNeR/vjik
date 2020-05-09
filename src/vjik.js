export default
function Vjik (el, opts) {
  const args = Array.isArray(el) ? el : [el, opts];
  return new Vjik.Bar(...args);
}

Vjik.ALIGN_DIRECTION = {
  NONE: 'NONE',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};
Vjik.DRAG_START_EVENTS = ['mousedown', 'touchstart', 'pointerdown'];
Vjik.DRAG_MOVE_EVENTS = ['mousemove', 'touchmove', 'pointermove'];
Vjik.DRAG_END_EVENTS = ['mouseup', 'touchend', 'pointerup'];
