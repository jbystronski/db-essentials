module.exports = isRegularObject = (value) =>
  value !== null && value.constructor.name === "Object";
