const assert = require("assert").strict;
const { getFilterFunction } = require("../src/utils/filterData");

describe(`testing "getFilterFunction" function`, () => {
  it("should return false, true based on the input", function () {
    assert.equal(getFilterFunction("_not_equal", "book", "hand"), true);
    assert.equal(getFilterFunction("_gt", 3, 14), true);
    assert.equal(getFilterFunction("_lt", 3, 14), false);
    assert.equal(getFilterFunction("_lt", 17, 2), true);
    assert.equal(getFilterFunction("_gte", 17, 2), false);
    assert.equal(getFilterFunction("_gte", 2, 2), true);
    assert.equal(getFilterFunction("_lte", 2, 10), false);
    assert.equal(getFilterFunction("_lte", 22, 10), true);
    assert.equal(getFilterFunction("_equals", "milk", "milk"), true);
  });
});
