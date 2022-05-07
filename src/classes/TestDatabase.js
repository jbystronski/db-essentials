const path = require("path");
const fs = require("fs").promises;
const Database = require("./Database");
const LocalParser = require("./LocalParser");

module.exports = class TestDatabase extends Database {
  constructor(database) {
    super();
    this.localPath = database
      ? path.resolve(database)
      : path.resolve(__dirname, "./../../@dev/test_files");
    this._db = {};
  }

  async _dumpDocumentIds(modelNamesArray) {
    try {
      const container = [];

      for (const name in modelNamesArray) {
        const res = await this.run(`find/${modelNamesArray[name]}?_only=_id`);

        container.push(res.map((el) => el._id));
      }

      return container;
    } catch (e) {
      this.getError(e);
    }
  }

  async count() {
    try {
      const res = await this.find();
      return res.length;
    } catch (e) {
      this.getError(e);
    }
  }

  async findOne() {
    try {
      return this.parser.parseFindOne();
    } catch (e) {
      this.getError(e);
    }
  }

  async find() {
    try {
      return this.parser.parseFind();
    } catch (e) {
      this.getError(e);
    }
  }

  async updateOne() {
    try {
      this._db[this.table] = this.parser.parseUpdateOne();

      return this._db[this.table];
    } catch (e) {
      this.getError(e);
    }
  }

  async updateMany() {
    try {
      this._db[this.table] = this.parser.parseUpdateMany();

      return this._db[this.table];
    } catch (e) {
      this.getError(e);
    }
  }

  async insert() {
    try {
      this._db[this.table] = this.parser.parseInsertable();

      return this._db[this.table];
    } catch (e) {
      this.getError(e);
    }
  }

  async deleteMany() {
    try {
      this._db[this.table] = this.parser.parseDeleteMany();

      return this._db[this.table];
    } catch (e) {
      this.getError(e);
    }
  }

  async deleteOne() {
    try {
      this._db[this.table] = this.parser.parseDeleteOne();

      return this._db[this.table];
    } catch (e) {
      this.getError(e);
    }
  }

  async establishConnection() {
    try {
      return this;
    } catch (e) {
      this.getError(e);
    }
  }

  async setupDbTable(file) {
    const records = await fs.readFile(this.localPath + "/" + file + ".json");

    this._db[file] = JSON.parse(records);
    return this._db[file];
  }

  async run(query = null, body = null) {
    super.run(query, body);

    try {
      const tableData = await this.setupDbTable(this.table);
      const data = tableData ? JSON.parse(JSON.stringify(tableData)) : [];

      this.parser = new LocalParser(this.params, this.body, data);
      this.parser.run();

      const result = await this[this.action]();

      return result;
    } catch (e) {
      this.getError(e);
    }
  }
};
