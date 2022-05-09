const Connection = require("./classes/Connection");
const resolveConnection = require("./resolveConnection");

let connection = null;

module.exports = async function cachedConnection(
  config = { database: null },
  mode = "no_persist"
) {
  try {
    if (
      !connection ||
      connection.mode !== mode ||
      connection.db !== config.database
    ) {
      const Instance = resolveConnection(mode);
      connection = await new Instance(config, mode).establishConnection();
    }

    return connection;
  } catch (e) {
    throw new Error(e);
  }
};
