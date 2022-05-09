const assert = require("assert").strict;

const cachedConnection = require("../src/cachedConnection");
const Query = require("../src/classes/Query");

describe("Testing Query class", () => {
  it("Should return an array of two records", async () => {
    const conn = await cachedConnection();
    const url = "/find/test_data?_limit=2&_except=nested,created_at,updated_at";

    const res = await new Query(conn).run(url);

    assert.deepEqual(res, [
      {
        name: "computer",
        value: 2983,
        color: "pink",
        published: true,
        _id: 1
      },
      {
        name: "stereo",
        value: 312,
        color: "black",
        published: false,
        _id: 2
      }
    ]);
  });

  // it("Filter records by a nested property and get only that property, note: _id is included by default ", async () => {
  //   const conn = await cachedConnection();
  //   const value = "hidden mouse value";
  //   const url =
  //     "/find/test_data?nested.hidden.value=" +
  //     value +
  //     "&_only=nested.hidden.value";
  //   const res = await new Query(conn).run(url);
  //   assert.deepEqual(res, [
  //     {
  //       _id: 3,
  //       nested: {
  //         hidden: {
  //           value: "hidden mouse value"
  //         }
  //       }
  //     }
  //   ]);
  // });

  // it("Should return table name string", async () => {
  //   const conn = await cachedConnection();
  //   const res = await new Query(conn).run("https://somedomain/find/users");

  //   assert.equal(res.table, "users");
  // });

  // it("Should return url string", async () => {
  //   const conn = await cachedConnection();
  //   const res = await new Query(conn).run("https://somedomain/find/users");
  //   assert.equal(res.url, "https://somedomain/find/users");
  // });

  // it("Should return cached connection", async () => {
  //   const conn = await cachedConnection();
  //   assert.equal(conn.isCached, true);
  // });
});
