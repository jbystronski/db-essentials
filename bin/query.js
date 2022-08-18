#!/usr/bin/env node

const [db, mode, q, toString = false] = process.argv.slice(2);

const Query = require("./../src/classes/Query");
const cachedConnection = require("./../src/cachedConnection");

(async function () {
  if (!q) {
    console.error("No query provided, quitting");
    process.exit();
  }

  try {
    console.time("query time");

    const res = await new Query(
      await cachedConnection(
        {
          database: db.replace("db=", "")
        },
        mode.replace("mode=", "")
      )
    ).run(q);

    console.log("query result: ", toString ? JSON.stringify(res) : res);
    console.timeEnd("query time");
  } catch (e) {
    throw new Error(e);
  }
})();
