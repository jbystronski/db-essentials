const assert = require("assert").strict;

const cachedConnection = require("../src/cachedConnection");

describe("Testing queries with search params, without body", () => {
  it("Should return an array of two records", async () => {
    const db = await cachedConnection();
    const url = "/find/test_data?limit=2&except=nested";
    const res = await db.run(url);
    assert.deepEqual(res, [
      {
        name: "computer",
        value: 2983,
        color: "pink",
        created_at: "2022-04-23T15:31:25.638Z",
        published: true,
        _id: 1
      },
      {
        name: "stereo",
        value: 312,
        color: "black",
        created_at: "2022-04-23T15:31:25.638Z",
        published: false,
        _id: 2
      }
    ]);
  });

  it("Filter records by a nested property and get only that property, note: _id is included by default ", async () => {
    const db = await cachedConnection();
    const value = "hidden mouse value";
    const url =
      "/find/test_data?nested.hidden.value=" +
      value +
      "&only=nested.hidden.value";
    const res = await db.run(url);
    assert.deepEqual(res, [
      {
        _id: 3,
        nested: {
          hidden: {
            value: "hidden mouse value"
          }
        }
      }
    ]);
  });
});

describe("Getting table name", () => {
  it("Should return table name string", async () => {
    const db = await cachedConnection();
    db.run("https://somedomain/find/users");
    assert.equal(db.table, "users");
  });
});

describe("Getting database action method name", () => {
  it("Should return action name string", async () => {
    const db = await cachedConnection();
    assert.equal(db.matchAction("save"), "insert");
    assert.equal(db.matchAction("paginate"), "find");
    assert.equal(db.matchAction("save_many"), "insert");
  });
});

describe("Getting the url", () => {
  it("Should return url string", async () => {
    const db = await cachedConnection();
    assert.equal(db.url, "https://somedomain/find/users");
  });
});

describe("Filter functions test", () => {
  it("Should return false, true based on the input", async () => {
    const db = await cachedConnection();

    assert.equal(
      db.filterFunctions("not_in", ["toy", "food", "book"], "hand"),
      true
    );
    assert.equal(db.filterFunctions("contains", "sha", "shield"), false);
    assert.equal(db.filterFunctions("contains", "pi", "black"), false);
    assert.equal(db.filterFunctions("not", "book", "hand"), true);
    assert.equal(db.filterFunctions("gt", 3, 14), true);
    assert.equal(db.filterFunctions("lt", 3, 14), false);
    assert.equal(db.filterFunctions("lt", 17, 2), true);
    assert.equal(db.filterFunctions("min", 17, 2), false);
    assert.equal(db.filterFunctions("min", 2, 2), true);
    assert.equal(db.filterFunctions("max", 2, 10), false);
    assert.equal(db.filterFunctions("max", 22, 10), true);
    assert.equal(db.filterFunctions("equals", "milk", "milk"), true);
  });
});
