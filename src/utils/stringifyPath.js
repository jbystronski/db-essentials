const isType = require("./isType");

module.exports = stringifyPath = (obj, p = "") => {
  const k = Object.keys(obj);

  return isType(obj[k], "object")
    ? stringifyPath(obj[k], p + k + ".")
    : [p + k, obj[k]];
};
