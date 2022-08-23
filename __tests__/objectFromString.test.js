const assert = require("assert").strict;
const objectFromString = require("../src/utils/objectFromString");

describe(`testing "objectFromString" function`, () => {
  it("should parse a string into an object", () => {
    assert.deepEqual(
      objectFromString("top.firstNesting.secondNesting", "someValue"),

      { top: { firstNesting: { secondNesting: "someValue" } } }
    );
  });
});
