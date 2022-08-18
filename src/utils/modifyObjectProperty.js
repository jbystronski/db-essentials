const isType = require("./isType");

module.exports = modifyObjectProperty = (src, ob, modifier) => {
  return src.split(".").reduce((acc, prop) => {
    if (prop in acc) {
      if (!isType(acc[prop], "object")) {
        acc[prop] = isType(modifier, "function")
          ? modifier(acc[prop])
          : modifier;
      } else {
        return modifyObjectProperty(prop, acc[prop], modifier);
      }
    }
    return ob;
  }, ob);
};
