#!/usr/bin/env node

const [db, mode, q, toString = false] = process.argv.slice(2);

const path = require("path");

const SearchQuery = require("./../src/classes/SearchQuery");

(async function () {
  if (!q) {
    console.error("No query provided, quitting");
    process.exit();
  }

  try {
    const query = new SearchQuery(
      mode.replace("mode=", ""),
      db.replace("db=", "")
    );

    await query.run(q, toString);
  } catch (e) {
    throw new Error(e);
  }
})();
