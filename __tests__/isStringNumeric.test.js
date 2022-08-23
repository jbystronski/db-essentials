const assert = require("assert").strict;
const isStringNumeric = require("../src/utils/isStringNumeric");

describe(`testing "isStringNumeric" function`, () => {
  it(`should return true or false, based on whether the string can be parsed into valid number`, function () {
    [
      ["2", true],
      ["0.2", true],
      ["2.0", true],
      ["0", true],
      ["foo", false],
      [[], false],
      [NaN, false],
      [{}, false],
      [true, false],
      [null, false],
    ].map(([exp, res]) => assert.equal(isStringNumeric(exp), res));
  });
});
