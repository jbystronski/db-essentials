const cachedConnection = require("./../cachedConnection");
const ErrorHandler = require("./../errors/ErrorHandler");

module.exports = class SearchQuery {
  constructor(mode, config) {
    this.mode = mode;
    this.config = config;
  }

  async run(q, toString = false) {
    try {
      const connection = await cachedConnection(this.mode, {
        localPath: this.config
      });
      console.time("qTime");
      const res = await connection.run(q);

      console.log("Query result", toString ? JSON.stringify(res) : res);
      console.log("PARSER IN SearchQuery", connection.parser);
      console.timeEnd("qTime");
    } catch (e) {
      return new ErrorHandler(e);
    }
  }
};
