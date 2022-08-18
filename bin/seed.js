#!/usr/bin/env node

const path = require("path");
const cachedConnection = require("../src/cachedConnection");
const Query = require("../src/classes/Query");

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
  if (count > 1000) {
    console.log("A single insert cannot exceed 1000 records");
    return false;
  }

  if (!table)
    throw new Error("Mandatory parameter 'table' has not been provided!");

  (async function () {
    console.time("Time");

    const seederPayload = await build(count);

    const toSave =
      seederPayload.length > 1 ? { _save: seederPayload } : seederPayload[0];
    const method = seederPayload.length > 1 ? "save_many" : "save_one";

    const q = await new Query(
      await cachedConnection({ database: database }, mode)
    ).run(`${method}/${table}`, toSave);

    console.log("Created documents: " + count);
    console.timeEnd("Time");
  })();
} catch (e) {
  throw new Error(e);
}
