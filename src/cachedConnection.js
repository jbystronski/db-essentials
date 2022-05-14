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
      (config.database !== null && connection.db !== config.database)
    ) {
      const Resolved = resolveConnection(mode);
      const Instance = new Resolved(config, mode);
      connection = await Instance.establishConnection();

      return connection;
    }

    return connection;
  } catch (e) {
    throw new Error(e);
  }
};
