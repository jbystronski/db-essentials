const parseEncodedUri = require("../utils/parseEncodedUri");
const Parser = require("./Parser");
const Filesystem = require("./Filesystem");

getUrlSegments = (url) => url.split("?")[0].split("/").reverse();

getParams = (url) => {
  const parametersString = url.split("?")[1];

  return parametersString ? parametersString.split("&") : null;
};

create = ({ connection, url, body }) => {
  return {
    async run() {
      try {
        if (!url) throw Error(`Missing url, aborting`);

        url = parseEncodedUri(url);

        const parser = Parser.create(
          (await connection.getCollection(getUrlSegments(url)[0])) || [],
          getParams(url),
          (body = body && typeof body === "string" ? JSON.parse(body) : body) // parse body object if present
        );

        try {
          const { save, payload, error } = await parser.run(
            getUrlSegments(url)[1] // url action
          );

          save &&
            connection.mode === "persist" &&
            Filesystem.persist(
              save,
              `${connection.database}/${getUrlSegments(url)[0]}.json`
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
