module.exports = isStringNumeric = (value) =>
  typeof value !== "string"
    ? false
    : !isNaN(value) && !isNaN(parseFloat(value));
