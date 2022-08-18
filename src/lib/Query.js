const parseEncodedUri = require("../utils/parseEncodedUri");
const Parser = require("./Parser");
const Filesystem = require("./Filesystem");

const COLLECTION_INIT_ACTIONS = ["save_one", "save_many"];

const CRUD_ACTIONS = {
  save_one: "insert",
  save_many: "insert",
  find: "find",
  find_one: "findOne",
  update_one: "updateOne",
  update_many: "updateMany",
  delete_one: "deleteOne",
  delete_many: "deleteMany",
  count: "count",
};

async function dumpDocumentIds(collectionNames) {
  try {
    const container = [];

    for (const name in collectionNames) {
      const res = await this.run(`find/${modelNamesArray[name]}?_only=_id`);

      container.push(res.map((el) => el._id));
    }

    return container;
  } catch (e) {
    console.error(e);
  }
}

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

        await parser.run();

        try {
          const { data, payload, error } = await parser[CRUD_ACTIONS[action]]();

          data &&
            connection.mode === "persist" &&
            Filesystem.persist(data, `${connection.db}/${table}.json`);

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
