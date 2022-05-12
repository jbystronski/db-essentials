const ErrorHandler = require("../errors/ErrorHandler");
module.exports = class QueryResolver {
  constructor() {
    // no instantiation of the top class allowed

    if (this.constructor.name === "Resolver") {
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

    this.error = null;

    this.url;
    this.query;
    this.table;
    this.action;
    this.params;
    this.body;
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

  parseEncodedUri(str) {
    const toReplace = {
      "%2C": ",",
      "%2F": "/",
      "%3D": "=",
      "%2E": ".",
      "%26": "&",
      "%2A": "*",
      "%2B": "+",
      "%2D": "-",
      "%21": "!",
      "%23": "%",
      "%3F": "?",
      "%5C": `\\`,
      "%5E": "^",
      "%5F": "_",
      "%5B": "[",
      "%5D": "]",
      "%7E": "~",
      "%7B": "{",
      "%7D": "}",
      "%7C": "|",
      "%3A": ":",
      "%3C": "<",
      "%3E": ">",
      "%3B": ";",
      "%28": "(",
      "%29": ")"
    };

    Object.keys(toReplace).forEach((enc) => {
      if (str.includes(enc)) {
        str = str.replaceAll(enc, toReplace[enc]);
      }
    });

    return str;
  }

  getError(e, msg = null) {
    this.error = new ErrorHandler(e, {
      msg: msg
    });
  }

  async run(query = null, body = null) {
    if (!query) {
      console.log(`Cannot run a query against nothing`);
      return;
    }

    this.body = body && typeof body === "string" ? JSON.parse(body) : body;

    try {
      query = this.parseEncodedUri(query);

      this.query = query;
      this.url = query;

      if (query.indexOf("?") !== -1) {
        const [url, queryParams] = query.split("?");

        this.params = queryParams.split("&");

        this.url = url;
      }
      const segments = this.url.split("/").reverse();

      this.action = this.matchAction(segments[1]);

      this.table = segments[0];
    } catch (e) {
      this.getError(e);
    }
  }
};
