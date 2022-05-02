const path = require("path");

const defaultPath = path.resolve(__dirname, "./../../@dev/test_files");

module.exports = class Database {
  constructor(config) {
    const { localPath = defaultPath } = config;
    // no instantiation of the top class allowed

    if (this.constructor.name === "Database") {
      throw new Error(
        `Instantiation of ${this.constructor.name} is not allowed.`
      );
    }

    // unified database method aliases

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
    this.config = config;
    this.localPath = localPath; // path to your local database json files
    this.url = null; // passed url
    this.query = null; // passed query
    this.table = null; // the database table to be populated
    this.action = null; // database query action
    this.cachedQuery = null; // cached query string
    this.cachedQueryResults = null; // cached query result

    this.params = null;
    this.body = null;
  }

  /**
   * @param {string} action - database action got from the client
   */

  mustImplement(m) {
    throw new Error(`Method "${m}" not found in descendant class`);
  }

  matchAction(action) {
    return this.actions[action];
  }

  clearCache() {
    this.cachedQueryResults = null;
    this.cachedQuery = null;
  }

  /**
   * @param {string} query - url with search params (GET, DELETE)
   * @param {object} body -  data object (POST, PUT)
   */

  async establishConnection() {
    return this.mustImplement(arguments.callee.name);
  }

  async _dumpDocumentIds() {
    return this.mustImplement(arguments.callee.name);
  }

  async run(query = null, body = null) {
    this.body = body && typeof body === "string" ? JSON.parse(body) : body;
    console.log("running db");
    try {
      this.query = query;
      this.url = query;

      let params = null;

      // check if there are any query params

      if (query.indexOf("?") !== -1) {
        const [url, queryParams] = query.split("?");

        this.params = queryParams.split("&");

        this.url = url;
      }
      const segments = this.url.split("/").reverse();

      // match query action

      this.action = this.matchAction(segments[1]);

      // set db resource to fetch or modify

      this.table = segments[0];

      // copy original data to prevent unnecessary modification if more queries are ahead

      // run database query
    } catch (error) {
      throw new Error(error);
    }
  }
};
