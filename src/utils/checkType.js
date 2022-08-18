module.exports = checkType = (value, type) =>
  Object.prototype.toString.call(value).slice(8, -1).toLowerCase() === type;
