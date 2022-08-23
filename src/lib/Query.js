const parseEncodedUri = require("../utils/parseEncodedUri");
const Parser = require("./Parser");
const Filesystem = require("./Filesystem");

getUrlSegments = (url) => url.split("?")[0].split("/").reverse();

getParams = (url) => {
  const parametersString = url.split("?")[1];

  return parametersString ? parametersString.split("&") : null;
};

create = ({ connection, url, body }) => {
  if (!connection) throw "Missing connection";

  const { database, getCollection, mode = "persist" } = connection;

  return {
    async run() {
      try {
        if (!url) throw `Missing url, aborting`;
        if (!database) throw `No database connection, aborting`;

        url = parseEncodedUri(url);

        const parser = Parser.create(
          (collectiom = (await getCollection(getUrlSegments(url)[0])) || []),
          getParams(url),
          body ? JSON.parse(body) : null
        );

        try {
          const { save, payload, error } = await parser.run(
            getUrlSegments(url)[1] // url action
          );

          save &&
            mode === "persist" &&
            Filesystem.persist(
              save,
              `${database}/${getUrlSegments(url)[0]}.json`
            );

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
