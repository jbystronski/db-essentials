const getDatabaseClient = require("./getDatabaseClient");
const ErrorHandler = require("./errors/ErrorHandler");

let connection = null;

module.exports = async function cachedConnection(
  mode = "no_persist",
  config = null
) {
  try {
    if (connection) {
      return connection;
    }

    const DbClient = getDatabaseClient(mode);

    const instance = new DbClient(config);

    connection = await instance.establishConnection();
    connection.isCached = true;

    return connection;
  } catch (e) {
    return new ErrorHandler(e);
  }
};
