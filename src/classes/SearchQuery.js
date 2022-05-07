const cachedConnection = require("./../cachedConnection");
const ErrorHandler = require("./../errors/ErrorHandler");

module.exports = class SearchQuery {
  constructor(mode, config) {
    this.mode = mode;
    this.config = config;
  }

  async run(q, toString = false) {
    try {
      const connection = await cachedConnection(this.mode, this.config);
      console.time("query time");
      const res = await connection.run(q);
      console.log("this", connection);

      console.log("query result: ", toString ? JSON.stringify(res) : res);

      console.timeEnd("query time");
    } catch (e) {
      return new ErrorHandler(e);
    }
  }
};
