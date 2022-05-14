const assert = require("assert").strict;
const cachedConnection = require("../src/cachedConnection");

describe("Testing cachedConnection function", () => {
  it("Should confirm that both variable point to the same connection instance", async () => {
    const firstConnection = await cachedConnection();
    const secondConnection = await cachedConnection();

    assert.equal(firstConnection === secondConnection, true);
  });
});
