const resolveConnection = require("./resolveConnection");
const ErrorHandler = require("../src/errors/ErrorHandler");

let connection = null;

module.exports = async function cachedConnection(config, mode = "no_persist") {
  try {
    if (!config.database) {
      this.getError(new Error(), "unmet database credentials");
    }

    if (
      !connection ||
      connection.mode !== mode ||
      connection.db !== config.database
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
