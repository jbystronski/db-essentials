const assert = require("assert").strict;

const cachedConnection = require("../src/cachedConnection");

describe("Testing TestDatabase class", () => {
  it("Should return an array of two records", async () => {
    const db = await cachedConnection();
    const url = "/find/test_data?_limit=2&_except=nested";
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
      "&_only=nested.hidden.value";
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

  it("Should return table name string", async () => {
    const db = await cachedConnection();
    db.run("https://somedomain/find/users");
    assert.equal(db.table, "users");
  });

  it("Should return url string", async () => {
    const db = await cachedConnection();
    assert.equal(db.url, "https://somedomain/find/users");
  });

  it("Should return action name string", async () => {
    const db = await cachedConnection();
    assert.equal(db.matchAction("save_one"), "insert");

    assert.equal(db.matchAction("save_many"), "insert");
  });

  it("Should return cached connection", async () => {
    const db = await cachedConnection();
    assert.equal(db.isCached, true);
  });
});
