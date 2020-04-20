export
function isString (s) {
  return typeof s === 'string' || s instanceof String;
}

export
function bound (min, val, max) {
  if (min != null) val = Math.max(min, val);
  if (max != null) val = Math.min(max, val);
  return val;
}
