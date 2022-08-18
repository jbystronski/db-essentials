const checkType = require("./checkType");

module.exports = (value, type) => {
  try {
    return Array.isArray(type)
      ? type.map((t) => checkType(value, t)).includes(true) || false
      : checkType(value, type);
  } catch (e) {
    console.error(e);
  }
};
