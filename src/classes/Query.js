const fs = require("fs").promises;
const Resolver = require("./Resolver");
const LocalParser = require("./LocalParser");

module.exports = class Query extends Resolver {
  constructor(connection) {
    super();
    this.connection = connection;
  }

  async fileExists() {
    try {
      const result = await fs.lstat(`${this.connection.db}/${this.table}.json`);
      return result;
    } catch (e) {
      this.getError(e);
    }
  }

  async getFileContents() {
    try {
      const res = await fs.readFile(`${this.connection.db}/${this.table}.json`);
      const stringContent = res.toString();

      const parsed = JSON.parse(stringContent);

      return parsed;
    } catch (e) {
      this.getError(e);
    }
  }

  async writeToFile(data, options = {}) {
    try {
      await fs.writeFile(
        `${this.connection.db}/${this.table}.json`,
        JSON.stringify(data)
      );
    } catch (e) {
      this.getError(e);
    }
  }

  async shouldPersist(data) {
    try {
      if (this.connection.mode === "persist") {
        await this.writeToFile(data);
      }
    } catch (e) {
      this.getError(e);
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
    } catch (e) {
      this.getError(e);
    }
  }

  async count() {
    try {
      const res = (await this.find()) || [];
      return res.length;
    } catch (e) {
      this.getError(e);
    }
  }

  async findOne() {
    this.abortOnMissingCollection(this.table);

    try {
      return this.parser.parseFindOne();
    } catch (e) {
      this.getError(e);
    }
  }

  async find() {
    this.abortOnMissingCollection(this.table);

    try {
      return this.parser.parseFind();
    } catch (e) {
      this.getError(e);
    }
  }

  async updateOne() {
    this.abortOnMissingCollection(this.table);

    try {
      const [updatedRecord, data] = this.parser.parseUpdateOne();

      this.updateCollection(this.table, data);
      this.shouldPersist(data);

      return updatedRecord;
    } catch (e) {
      this.getError(e);
    }
  }

  async updateMany() {
    this.abortOnMissingCollection(this.table);

    try {
      const [count, data] = this.parser.parseUpdateMany();

      this.updateCollection(this.table, data);
      this.shouldPersist(data);
      return `updated records: ${count}`;
    } catch (e) {
      this.getError(e);
    }
  }

  async insert() {
    try {
      const [saved, data] = this.parser.parseInsertable();

      this.updateCollection(this.table, data);
      this.shouldPersist(data);
      return saved;
    } catch (e) {
      this.getError(e);
    }
  }

  async deleteMany() {
    this.abortOnMissingCollection(this.table);

    try {
      const [count, data] = this.parser.parseDeleteMany();

      this.updateCollection(this.table, data);
      this.shouldPersist(data);

      return `deleted records: ${count}`;
    } catch (e) {
      this.getError(e);
    }
  }

  async deleteOne() {
    this.abortOnMissingCollection(this.table);

    try {
      const [deleted, data] = this.parser.parseDeleteOne();

      this.updateCollection(this.table, data);

      this.shouldPersist(data);

      return deleted;
    } catch (e) {
      this.getError(e);
    }
  }

  getCollection(name) {
    try {
      return this.connection.collections[name] || [];
    } catch (error) {
      this.getError(e);
    }
  }

  updateCollection(name, data) {
    try {
      this.connection.collections[name] = data;
    } catch (e) {
      this.getError(e);
    }
  }

  abortOnMissingCollection(name) {
    try {
      const coll = this.getCollection(name);
      if (!coll.length) {
        this.getError(new ReferenceError(), `Collection ${name} not found!`);
      }
      return true;
    } catch (e) {
      this.getError(e);
    }
  }

  async run(q, body) {
    super.run(q, body);

    try {
      this.parser = new LocalParser(
        this.params,
        this.body,
        this.getCollection(this.table)
      );

      this.parser.run();

      const result = await this[this.action]();

      return result;
    } catch (e) {
      this.getError(e);
    }
  }
};
