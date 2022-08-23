const assert = require("assert").strict;
const {
  _cdate,
  _slice,
  _only,
  _sort,
  _skip,
  _limit,
} = require("../src/lib/PostParsers");

const data = require("../example/test_files/test_data.json");

describe("testing PostParsers module", () => {
  it(`run _cdate parser to create a timestamp field on a record`, () => {
    assert.strictEqual(
      _cdate({
        data: data.slice(0, 1),
        queries: { _cdate: { updated_at: { _type: "timestamp" } } },
      })[0]["updated_at"],
      Date.now()
    );
  });
  it(`run _slice parser to get a range of four records, starting from third index`, () => {
    const res = _slice({
      data: data,
      queries: { _slice: [2, 4] },
    });

    assert.deepEqual(
      _only({
        data: JSON.parse(JSON.stringify(res)),
        queries: { _only: ["_id", "name"] },
      }),
      [
        { _id: 3, name: "mouse" },
        { _id: 4, name: "headphones" },
        { _id: 5, name: "printer" },
        { _id: 6, name: "motorcycle" },
      ]
    );
  });
  it(`run _sort parser to sort return data by name in descending order`, () => {
    const res = _only({
      data: JSON.parse(JSON.stringify(data)),
      queries: { _only: ["name"] },
    });

    const sorted = _sort({
      data: JSON.parse(JSON.stringify(res)),
      queries: { _sort: { name: -1 } },
    });

    assert.deepEqual(sorted, [
      { name: "stereo", _id: 2 },
      { name: "sink", _id: 9 },
      { name: "printer", _id: 5 },
      { name: "pen", _id: 8 },
      { name: "mouse", _id: 3 },
      { name: "motorcycle", _id: 6 },
      { name: "headphones", _id: 4 },
      { name: "computer", _id: 1 },
      { name: "book", _id: 7 },
    ]);
  });

  it(`run _skip along with _limit to return a limited number of data with some records skipped`, () => {
    const skip = _skip({
      data: data,
      queries: { _skip: 3 },
    });

    const limit = _limit({
      data: skip,
      queries: { _limit: 2 },
    });

    const res = _only({
      data: limit,
      queries: { _only: ["name"] },
    });

    assert.deepEqual(res, [
      { name: "headphones", _id: 4 },
      { name: "printer", _id: 5 },
    ]);
  });
});
