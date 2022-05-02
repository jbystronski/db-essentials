const Database = require("./Database");

const LocalParser = require("./LocalParser");

const fs = require("fs").promises;

module.exports = class TestDatabase extends Database {
  constructor(props) {
    super(props);
    this.body = null;
    this._db = {};
  }

  async establishConnection() {
    try {
      for (const file of await fs.readdir(this.localPath)) {
        const records = await fs.readFile(this.localPath + "/" + file);
        const table = file.split(".json")[0];
        this._db[table] = JSON.parse(records);
      }

      return this;
    } catch (e) {
      throw new Error(e);
    }
  }

  async _dumpDocumentIds(modelNamesArray) {
    try {
      const container = [];

      for (const name in modelNamesArray) {
        const res = await this.run(`find/${modelNamesArray[name]}?_only=_id`);

        container.push(res.map((el) => el._id));
      }

      return container;
    } catch (error) {
      throw new Error(error);
    }
  }

  async count() {
    const res = await this.find();
    return res.length;
  }

  async findOne() {
    const res = await this.find();

    return res[0];
  }

  async find() {
    try {
      const data = await this.parser._parseSearchable();

      // cache results

      this.cachedQuery = this.query;
      this.cachedQueryResults = data;

      return data;
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateOne() {
    try {
      this._db[this.table] = await this.parser._parseUpdateOne();
      console.log("TABLE AFTER UPDATE", this._db[this.table]);
      return this._db[this.table];
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateMany() {
    try {
      this._db[this.table] = await this.parser._parseUpdateMany();
      console.log("table after update many ", this._db[this.table]);
      return;
      return this._db[this.table];
    } catch (error) {
      throw new Error(error);
    }
  }

  async insert() {
    console.log("inside insert");

    try {
      this._db[this.table] = await this.parser._parseInsertable();

      return this._db[this.table];
    } catch (error) {
      throw new Error(error);
    }
  }

  async deleteMany() {
    try {
      this._db[this.table] = await this.parser._parseDeleteMany();

      return this._db[this.table];
    } catch (error) {
      throw new Error(error);
    }
  }

  async deleteOne() {
    console.log("deleting one");
    try {
      const res = await this.parser._parseDeleteOne();

      this._db[this.table] = res;

      console.log(JSON.stringify(this._db[this.table]));
      return this._db[this.table];
    } catch (error) {
      throw new Error(error);
    }
  }

  async run(query = null, body = null) {
    super.run(query, body);
    console.log("running db");
    const data = this._db.hasOwnProperty(this.table)
      ? JSON.parse(JSON.stringify(this._db[this.table]))
      : [];

    this.parser = new LocalParser(this.params, this.body, data);
    this.parser.run();

    const result = await this[this.action]();

    return result;
  }
};
