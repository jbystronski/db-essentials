#!/usr/bin/env node

const path = require("path");
const getDatabaseClient = require("../src/getDatabaseClient");

const [seederFilesPath, database, mode, table, count = 1] =
  process.argv.slice(2);

const fromPattern = require(path.resolve(seederFilesPath) + `/${table}.js`);

async function build(times, container = []) {
  try {
    if (times === 0) {
      // You can just seed an array of predefined objects, otherwise the function will run till counter stops
      return Array.isArray(container[0]) ? [...container[0]] : container;
    }
    const records = await fromPattern();

    container.push(records);

    times--;
    return build(times, container);
  } catch (e) {
    throw new Error(e);
  }
}

try {
  if (count > 100) {
    console.log("A single insert cannot exceed 100 records");
    return false;
  }

  if (!table)
    throw new Error("Mandatory parameter 'table' has not been provided!");

  (async function () {
    const DbClient = getDatabaseClient(mode);

    const db = new DbClient(database);

    const conn = await db.establishConnection();
    console.log("db", conn);
    console.time("Time");

    const seederPayload = await build(count);

    const toSave =
      seederPayload.length > 1 ? { _save: seederPayload } : seederPayload[0];
    const method = seederPayload.length > 1 ? "save_many" : "save_one";

    await conn.run(`${method}/${table}`, toSave);

    console.log("Created documents: " + count);
    console.timeEnd("Time");
  })();
} catch (e) {
  throw new Error(e);
}
