export default
function Vjik (el, opts) {
  const args = Array.isArray(el) ? el : [el, opts];
  return new Vjik.Bar(...args);
}
