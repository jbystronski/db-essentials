const assert = require("assert").strict;
const { _and, _nor, _or } = require("../src/lib/InitialParsers");
const { _only } = require("../src/lib/PostParsers");
const data = require("../example/test_files/test_data.json");

describe("testing InitialParsers module", () => {
  it(`as stated in the "_or" condition, should return only records where color value is blue or pink`, () => {
    const res = _or({
      data: data,
      queries: { _or: { color: { _in: ["blue", "pink"] } } },
    });

    assert.deepEqual(
      _only({ data: res, queries: { _only: ["name", "color"] } }),
      [
        { name: "computer", color: "pink", _id: 1 },
        { name: "motorcycle", color: "pink", _id: 6 },
        { name: "pen", color: "blue", _id: 8 },
      ]
    );
  });

  it(`as stated in the "_nor" condition, should not return records with _id lower than 5 and greater than 7`, () => {
    const res = _nor({
      data: data,
      queries: { _nor: { _id: { _lt: 5, _gt: 7 } } },
    });

    assert.deepEqual(_only({ data: res, queries: { _only: ["name"] } }), [
      { _id: 5, name: "printer" },
      { _id: 6, name: "motorcycle" },
      { _id: 7, name: "book" },
    ]);
  });

  it(`as stated in the "_and" condition, should return records where _id is lower or eqaul to 6 and color is pink`, () => {
    const res = _and({
      data: data,
      queries: { _and: { _id: { _lte: 6, color: { _in: ["pink"] } } } },
    });

    assert.deepEqual(
      _only({ data: res, queries: { _only: ["name", "color"] } }),
      [
        { _id: 1, name: "computer", color: "pink" },
        { _id: 6, name: "motorcycle", color: "pink" },
      ]
    );
  });
});
