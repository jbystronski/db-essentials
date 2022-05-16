const assert = require("assert").strict;

const cachedConnection = require("../src/cachedConnection");
const Query = require("../src/classes/Query");

const path = require("path");
const config = {
  database: path.resolve(__dirname, "./../example/test_files")
};

describe("Testing Query class", () => {
  it("Should return an array of two records", async () => {
    const conn = await cachedConnection(config);
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
});
