module.exports = getObjectValue = (keys, ob) => {
  if (!keys) return;
  keys = !Array.isArray(keys) ? keys.split(".") : keys;

  return keys.reduce((p, c) => (p && p[c]) || null, ob);
};
