module.exports = {
  cachedConnection: require("./src/cachedConnection"),
  Connection: require("./src/classes/Connection"),
  ErrorHandler: require("./src/errors/ErrorHandler"),
  Parser: require("./src/classes/Parser"),
  Query: require("./src/classes/Query"),
  resolveConnection: require("./src/resolveConnection")
};
