#!/usr/bin/env node

const [db, mode, q, toString = false] = process.argv.slice(2);

const Query = require("../src/lib/Query");
const Connection = require("../src/lib/Connection");

(async function () {
  if (!q) {
    console.error("No query provided, quitting");
    process.exit();
  }

  try {
    console.time("query time");

    const conn = await Connection.create({
      label: "default",
      database: db.replace("db=", ""),
      mode: mode.replace("mode=", ""),
    });

    const query = Query.create({ connection: conn, url: q });

    const result = await query.run();

    console.log("query result: ", toString ? JSON.stringify(result) : result);
    console.timeEnd("query time");
  } catch (e) {
    conosole.error(e);
  }
})();
