const assert = require("assert").strict;
const path = require("path");
const cachedConnection = require("../src/cachedConnection");

describe("Testing cachedConnection function", () => {
  it("Should confirm that both variable point to the same connection instance", async () => {
    const config = {
      database: path.resolve(__dirname, "./../example/test_files")
    };
    const firstConnection = await cachedConnection(config);
    const secondConnection = await cachedConnection(config);

    assert.equal(firstConnection === secondConnection, true);
  });
});
