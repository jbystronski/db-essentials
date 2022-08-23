const assert = require("assert").strict;
const stringifyPath = require("../src/utils/stringifyPath");

describe(`testing "stringifyPath" function`, () => {
  it("should return an array containing a dot separated string path and value it points to", () => {
    assert.deepEqual(
      stringifyPath({
        top: { firstNesting: { secondNesting: "someValue" } },
      }),
      ["top.firstNesting.secondNesting", "someValue"]
    );
  });
});
