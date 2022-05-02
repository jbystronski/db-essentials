const getDatabaseClient = require("./getDatabaseClient");

let connection = null;

module.exports = async function cachedConnection(
  mode = "no_persist",
  config = {}
) {
  try {
    if (connection) {
      console.log("running cached connection");
      return connection;
    }

    const DbClient = getDatabaseClient(mode);

    const instance = new DbClient(config || {});

    connection = await instance.establishConnection();

    return connection;
  } catch (e) {
    console.error(e);
  }
};
