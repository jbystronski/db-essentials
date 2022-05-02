const Parser = require("../src/classes/Parser");
const ParserError = require("../src/errors/ParserError");
const TestDatabase = require("../src/classes/TestDatabase");
const assert = require("assert").strict;
const parser = new Parser([
  "sort.first_name=ASC",
  "limit=10",
  "except=gender,active",
  "only=first_name,email,created_at"
]);
parser.run();

describe("Getting parser functions queue", function () {
  it("Should return an array of strings representing available parsing methods", function () {
    assert.deepEqual(parser.getQueue(), ["sort", "limit", "except", "only"]);
  });
});

describe("Getting query object generated from passed query segments ", function () {
  it("Should return an object, built according to rules in processParsing method", function () {
    assert.deepEqual(parser.getQueryObject(), {
      except: ["gender", "active"],
      limit: 10,
      only: ["first_name", "email", "created_at"],
      sort: {
        first_name: 1
      }
    });
  });
});

describe("Getting prop from the Parser.getQueryObject method", function () {
  it("Should return a value of Parser.queryObject property ", function () {
    assert.deepEqual(parser.getQueryProp("sort"), { first_name: 1 });
    assert.equal(parser.getQueryProp("sort")["first_name"], 1);
    assert.equal(parser.getQueryProp("limit"), 10);
    assert.deepEqual(parser.getQueryProp("only"), [
      "first_name",
      "email",
      "created_at"
    ]);
  });
});

describe("Getting filtersObject from getFiltersObject method", () => {
  it("Should parse the body sent with the request and return an object containing only the elements that belong to the filters object", () => {
    const parser = new Parser(null, {
      first_name: "Jovan",
      only: "gender,email,active"
    });
    parser.run();
    assert.deepEqual(parser.getFiltersObject(), {
      first_name: "Jovan"
    });
  });
});

describe(`Clearing Parser.queryObject after parser's work is done`, function () {
  it("Should return an empty object", function () {
    parser.clear();
    assert.deepEqual(parser.getQueryObject(), {});
  });
});

describe("Parsing query string parameter", function () {
  it(`Should turn a string parameter, based on it's value, into an equivalent of other tyoe or return the string`, function () {
    [
      ["false", false],
      ["true", true],
      ["null", null],
      ["27", 27],
      ["0", 0],
      ["0.2", 0.2],
      ["1.456", 1.456]
    ].map(([expected, result]) =>
      assert.equal(parser.unstringify(expected), result)
    );
  });
});

describe("Check if a value can be presented as a number", function () {
  it(`Should return true or false`, function () {
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
});
