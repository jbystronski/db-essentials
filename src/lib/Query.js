const parseEncodedUri = require("../utils/parseEncodedUri");
const Parser = require("./Parser");
const Filesystem = require("./Filesystem");

const COLLECTION_INIT_ACTIONS = ["save_one", "save_many"];

getEndpoint = (url) => getUrlSegments(url).slice(2).reverse().join("/");

getUrlSegments = (url) => url.split("?")[0].split("/").reverse();

getAction = (url) => getUrlSegments(url)[1];

getTable = (url) => getUrlSegments(url)[0];

getParams = (url) => {
  const parametersString = url.split("?")[1];

  return parametersString ? parametersString.split("&") : null;
};

create = ({ connection, url, body = null }) => {
  return {
    async run() {
      try {
        if (!url) throw Exception(`Missing url, aborting`);
        body = body && typeof body === "string" ? JSON.parse(body) : body;

        url = parseEncodedUri(url);

        const action = getAction(url);

        const table = getTable(url);

        const params = getParams(url);

        const collection = (await connection.getCollection(table)) || [];

        if (!COLLECTION_INIT_ACTIONS.includes(action) && !collection.length) {
          return `Collection ${table} doesn't exist`;
        }

        const parser = Parser.create(collection, params, body);

        try {
          const { data, payload, error } = await parser.run(action);

          data &&
            connection.mode === "persist" &&
            Filesystem.persist(data, `${connection.database}/${table}.json`);

          return payload;
        } catch (e) {
          console.error(e);
        }
      } catch (e) {
        console.error(e);
      }
    },
  };
};

module.exports = { create };
