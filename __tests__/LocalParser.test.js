const assert = require("assert").strict;
const LocalParser = require("./../src/classes/LocalParser");

const p = new LocalParser();

describe("Testing LocalParser methods", () => {
  it("Functions grouped in filterFunctions method should return false, true based on the input", async () => {
    assert.equal(
      p.filterFunctions("_not_in", ["toy", "food", "book"], "hand"),
      true
    );
    assert.equal(p.filterFunctions("_contains", "sha", "shield"), false);
    assert.equal(p.filterFunctions("_contains", "pi", "black"), false);
    assert.equal(p.filterFunctions("_not_equal", "book", "hand"), true);
    assert.equal(p.filterFunctions("_gt", 3, 14), true);
    assert.equal(p.filterFunctions("_lt", 3, 14), false);
    assert.equal(p.filterFunctions("_lt", 17, 2), true);
    assert.equal(p.filterFunctions("_gte", 17, 2), false);
    assert.equal(p.filterFunctions("_gte", 2, 2), true);
    assert.equal(p.filterFunctions("_lte", 2, 10), false);
    assert.equal(p.filterFunctions("_lte", 22, 10), true);
    assert.equal(p.filterFunctions("_equals", "milk", "milk"), true);
  });

  it("Method getAllObjectKeys should return an array of dot separated strings representing object's nested keys", () => {
    assert.deepEqual(
      p.getAllObjectKeys({
        name: "mouse",
        value: 762,
        color: "white",
        created_at: "2022-05-03",
        published: true,
        nested: {
          parts: ["cable", "buttons"],
          hidden: {
            value: "hidden mouse value"
          }
        }
      }),
      [
        "name",
        "value",
        "color",
        "created_at",
        "published",
        "nested.parts",
        "nested.hidden.value",
        "nested.hidden",
        "nested"
      ]
    );
  });
});
