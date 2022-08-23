const assert = require("assert").strict;
const path = require("path");

const Connection = require("../src/lib/Connection");
const Query = require("../src/lib/Query");

describe("Testing Query class", async () => {
  const conn = await Connection.create({
    database: path.resolve("../@db-essentials/example/test_files"),
    mode: "persist",
    label: "default",
  });

  it("Should return an array of two records", async () => {
    const q1 = await Query.create({
      connection: conn,
      url: "/find/test_data?_limit=2&_except=nested,created_at,updated_at",
    });
    const q2 = await Query.create({
      connection: conn,
      url: "/update_one/test_data?_id=1&_set.value=3000",
    });
    const res1 = await q1.run();
    const res2 = await q2.run();

    console.log(res2);

    assert.deepEqual(res1, [
      {
        name: "computer",
        value: 3000,
        color: "pink",
        published: true,
        _id: 1,
      },
      {
        name: "stereo",
        value: 312,
        color: "black",
        published: false,
        _id: 2,
      },
    ]);

    assert.deepEqual(res2, [
      {
        name: "computer",
        value: 3000,
        color: "pink",
        created_at: "2022-05-09T19:28:13.929Z",
        updated_at: "2022-05-09T19:28:13.929Z",
        published: true,
        nested: {
          parts: ["screen", "keyboard"],
          hidden: { value: "hidden computer value" },
        },
        _id: 1,
      },
    ]);
  });
});
