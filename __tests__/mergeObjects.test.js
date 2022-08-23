const assert = require("assert").strict;
const mergeObjects = require("../src/utils/mergeObjects");

describe(`testing "mergeObjects" function`, () => {
  it(`should deep merge an array of objects and return a new object`, function () {
    const firstObject = {
      color: "silver",
      letters: ["A", "B", "C"],
    };

    const secondObject = {
      color: "black",
      letters: ["D", "E", "F", "G"],
      nestedValues: {
        first: "foo",
        second: "bar",
      },
    };

    const thirdObject = { name: "mergedObject" };

    assert.deepEqual(mergeObjects([firstObject, secondObject, thirdObject]), {
      color: "black",
      letters: ["D", "E", "F", "G"],

      nestedValues: { first: "foo", second: "bar" },
      name: "mergedObject",
    });
  });
});
