const path = require("path");
const ErrorHandler = require("./../errors/ErrorHandler");

module.exports = class Database {
  constructor() {
    // no instantiation of the top class allowed

    if (this.constructor.name === "Database") {
      throw new Error(
        `Instantiation of ${this.constructor.name} is not allowed.`
      );
    }

    this.actions = {
      save_one: "insert",
      save_many: "insert",
      find: "find",
      find_one: "findOne",
      update_one: "updateOne",
      update_many: "updateMany",
      delete_one: "deleteOne",
      delete_many: "deleteMany",
      count: "count"
    };

    this.url;
    this.query;
    this.table;
    this.action;
    this.params;
    this.body;
    this.isCached;
  }

  mustImplement(m) {
    throw new Error(`Method "${m}" not found in descendant class`);
  }

  matchAction(action) {
    return this.actions[action];
  }

  async establishConnection() {
    return this.mustImplement(arguments.callee.name);
  }

  async _dumpDocumentIds() {
    return this.mustImplement(arguments.callee.name);
  }

  async query(q, b) {
    await this.run(q, b);
  }

  async q(q, b) {
    await this.run(q, b);
  }

  getError(e) {
    return new ErrorHandler(e);
  }

  async run(query = null, body = null) {
    this.body = body && typeof body === "string" ? JSON.parse(body) : body;

    try {
      this.query = query;
      this.url = query;

      // check if there are any query params

      if (query.indexOf("?") !== -1) {
        const [url, queryParams] = query.split("?");

        this.params = queryParams.split("&");

        this.url = url;
      }
      const segments = this.url.split("/").reverse();

      // match query action

      this.action = this.matchAction(segments[1]);

      this.table = segments[0];
    } catch (e) {
      this.getError(e);
    }
  }
};
