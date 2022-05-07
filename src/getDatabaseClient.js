module.exports = function (mode) {
  switch (mode) {
    case "no_persist":
      return require("./classes/TestDatabase");
    case "local":
      return require("./classes/TestDatabaseWithPersistence");
    case "mongo":
      const { MongoDb } = require("db-essentials-mongo");
      return MongoDb;
    default:
      return require("./classes/TestDatabase");
  }
};
