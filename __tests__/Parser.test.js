const Parser = require("../src/classes/Parser");
const assert = require("assert").strict;

const parser = new Parser(null, {
  country: "Spain",
  _only: "gender,email,active,first_name",
  _sort: {
    first_name: 1
  },
  _limit: 10
});

parser.run();

describe("Testing Parser methods", function () {
  it(`Method parseValue should turn a string parameter, based on it's value, into an equivalent of other type or return the string`, function () {
    [
      ["false", false],
      ["true", true],
      ["null", null],
      ["27", 27],
      ["0", 0],
      ["0.2", 0.2],
      ["1.456", 1.456]
    ].map(([expected, result]) =>
      assert.equal(parser.parseValue(expected), result)
    );
  });

  it(`Method isValueNumeric should return true or false, based on whether the string can be parsed into valid number`, function () {
    const fn = parser.isValueNumeric;
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
      [null, false]
    ].map(([exp, res]) => assert.equal(fn(exp), res));
  });

  it("Should return a value of the queryObject property ", function () {
    assert.deepEqual(parser.getQueryProp("_sort"), { first_name: 1 });
    assert.equal(parser.getQueryProp("_sort")["first_name"], 1);
    assert.equal(parser.getQueryProp("_limit"), 10);
    assert.deepEqual(
      parser.getQueryProp("_only"),
      "gender,email,active,first_name"
    );
  });

  it("Should parse the body sent with the request and return an object containing only the elements that belong to the filters object", () => {
    parser.run();
    assert.deepEqual(parser.getFiltersObject(), {
      country: "Spain"
    });
  });

  it("Should return the true type of value", function () {
    assert.equal(parser.isType("cat", "string"), true);
    assert.equal(parser.isType(new Date(), "date"), true);
    assert.equal(parser.isType({}, "object"), true);
    assert.equal(parser.isType(null, "null"), true);
    assert.equal(parser.isType(12, "number"), true);
    assert.equal(parser.isType(false, "boolean"), true);
    assert.equal(parser.isType(undefined, "undefined"), true);
    assert.equal(parser.isType([1, 2, 3], "array"), true);
    assert.equal(parser.isType("", "string"), true);
    assert.equal(parser.isType(-0.876, "number"), true);
    assert.equal(parser.isType(Math, "math"), true);
    // passing an array of types to check is allowed
    assert.equal(parser.isType(null, ["object", "string"]), true);
  });
});
