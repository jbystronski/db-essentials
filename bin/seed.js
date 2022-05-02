#!/usr/bin/env node

const path = require("path");
const getDatabaseClient = require("../src/getDatabaseClient");

const [seederFilesPath, databasePath, mode, table, count = 1] =
  process.argv.slice(2);

const fromPattern = require(path.resolve(seederFilesPath) + `/${table}.js`);

async function build(times, container = []) {
  try {
    if (times === 0) {
      // You can just seed an array of predefined objects, otherwise the function will run till counter stops
      return Array.isArray(container[0]) ? [...container[0]] : container;
    }
    const records = await fromPattern();
    console.log("rec", records);

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

    const db = new DbClient(resolveClientConfig(mode));

    const conn = await db.establishConnection();

    console.time("Time");

    const seederPayload = await build(count);
    console.log("inside seedfer");
    const toSave =
      seederPayload.length > 1 ? { _save: seederPayload } : seederPayload[0];
    const method = seederPayload.length > 1 ? "save_many" : "save_one";

    console.log("payload", toSave);
    await conn.run(`${method}/${table}`, toSave);
    console.log(toSave);
    console.log("Created documents: " + count);
    console.timeEnd("Time");
  })();
} catch (e) {
  throw new Error(e);
}

function resolveClientConfig(mode) {
  switch (mode) {
    case "local":
      return { localPath: path.resolve(databasePath) };
    case "mongo":
      const [host, db, schemas] = databasePath.split(",");
      return {
        host: host.replace("host=", ""),
        database: db.replace("db=", ""),
        schemas: require(path.resolve(schemas.replace("schemas=", "")))
      };
  }
}
