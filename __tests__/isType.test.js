const assert = require("assert").strict;
const isType = require("../src/utils/isType");

describe(`testing "isType" function`, () => {
  it("Should return the true type of value", function () {
    assert.equal(isType("cat", "string"), true);
    assert.equal(isType(new Date(), "date"), true);
    assert.equal(isType({}, "object"), true);
    assert.equal(isType(null, "null"), true);
    assert.equal(isType(12, "number"), true);

    assert.equal(isType(undefined, "undefined"), true);
    assert.equal(isType([1, 2, 3], "array"), true);
    assert.equal(isType("", "string"), true);
    assert.equal(isType(-0.876, "number"), true);
    assert.equal(isType(Math, "math"), true);

    assert.equal(isType(null, ["object", "string"]), false);
  });
});
