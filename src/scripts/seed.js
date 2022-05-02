#!/usr/bin/env node

const path = require("path");
const getDatabaseClient = require("../getDatabaseClient");

const [seederFilesPath, databasePath, mode, table, count = 1] =
  process.argv.slice(2);

const fromPattern = require(path.resolve(seederFilesPath) + `/${table}.js`);

function build(times, container = []) {
  try {
    if (times === 0) {
      return Array.isArray(container[0]) ? [...container[0]] : container;
    }
    container.push(fromPattern());

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

    const db = new DbClient(path.resolve(databasePath));
    const conn = await db.establishConnection();

    console.time("Time");
    const payload = {
      save: build(count)
    };

    const result = await conn.run(`save/${table}`, payload);

    console.log(payload);
    console.log("Created documents: " + payload.save.length);
    console.timeEnd("Time");
  })();
} catch (e) {
  throw new Error(e);
}
