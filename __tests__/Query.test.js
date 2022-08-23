const assert = require("assert").strict;
const path = require("path");

const Connection = require("../src/lib/Connection");
const Query = require("../src/lib/Query");

describe("Testing Query module", async () => {
  const conn = await Connection.create({
    database: path.resolve("../@db-essentials/example/test_files"),
    mode: "no_persist",
    label: "default",
  });

  it("tests inserting a single record, should return an array with one record with an _id of 10", async () => {
    const query = await Query.create({
      connection: conn,
      url: "save_one/test_data",
      body: JSON.stringify({
        _save: { name: "smartphone", color: "silver", published: false },
      }),
    });

    const result = await query.run();

    assert.deepEqual(result, [
      { name: "smartphone", color: "silver", published: false, _id: 10 },
    ]);
  });

  it("tests inserting multiple records, should return an array of three records with _ids: 10,11,12", async () => {
    const query = await Query.create({
      connection: conn,
      url: "save_one/test_data",
      body: JSON.stringify({
        _save: [
          { name: "smartphone", color: "silver", published: false },
          { name: "comic book", color: "green", published: true },
          { name: "guitar", color: "red", published: false },
        ],
      }),
    });

    const result = await query.run();

    assert.deepEqual(result, [
      { name: "smartphone", color: "silver", published: false, _id: 10 },
      { name: "comic book", color: "green", published: true, _id: 11 },
      { name: "guitar", color: "red", published: false, _id: 12 },
    ]);
  });

  it("tests upating a single record, should return an array with one record with updated values", async () => {
    const query = await Query.create({
      connection: conn,
      url: "update_one/test_data",
      body: JSON.stringify({
        _id: 1,
        _set: {
          name: "smartphone",
          color: "silver",
          published: false,
          nested: null,
        },
        _inc: {
          value: 100,
        },
      }),
    });

    const result = await query.run();

    assert.deepEqual(result, [
      {
        name: "smartphone",
        value: 3100,
        color: "silver",
        created_at: "2022-05-09T19:28:13.929Z",
        updated_at: "2022-05-09T19:28:13.929Z",
        published: false,
        nested: null,
        _id: 1,
      },
    ]);
  });

  it("tests deleting a single record, should return an object representing deleted record", async () => {
    const query = await Query.create({
      connection: conn,
      url: "delete_one/test_data?_id=1",
    });

    const result = await query.run();

    assert.deepEqual(result, {
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
    });
  });

  it("tests deleting multiple records, should return an array containing ids of deleted records", async () => {
    const query = await Query.create({
      connection: conn,
      url: "delete_many/test_data?color._in=pink,blue",
    });

    const result = await query.run();

    assert.deepEqual(result, [1, 6, 8]);
  });

  it("tests counting records, should return the count of records matching criteria", async () => {
    const query = await Query.create({
      connection: conn,
      url: "count/test_data?color._in=pink,blue",
    });

    const result = await query.run();

    assert.strictEqual(result, 3);
  });

  it("tests find_one method, should return the first record that matches criteria", async () => {
    const query = await Query.create({
      connection: conn,
      url: "find_one/test_data?color._in=pink,blue&_only=name,color",
    });

    const result = await query.run();
    assert.deepEqual(result, { name: "computer", color: "pink", _id: 1 });
  });

  it("tests find method, should return an array containing all records that matches criteria", async () => {
    const query = await Query.create({
      connection: conn,
      url: "find/test_data?color._in=pink,blue&_id._gt=4&_only=name,color",
    });

    const result = await query.run();

    assert.deepEqual(result, [
      { name: "motorcycle", color: "pink", _id: 6 },
      { name: "pen", color: "blue", _id: 8 },
    ]);
  });
});
