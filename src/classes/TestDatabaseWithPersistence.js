const TestDatabase = require("./TestDatabase");
const fs = require("fs").promises;

module.exports = class TestDatabaseWithPersistence extends TestDatabase {
  constructor(db) {
    super(db);
  }

  async fileExists() {
    try {
      const result = await fs.lstat(`${this.localPath}/${this.table}.json`);
      return result;
    } catch (e) {
      this.getError(e);
    }
  }

  async writeToFile(content, options = {}) {
    try {
      await fs.writeFile(
        `${this.localPath}/${this.table}.json`,
        content,
        options
      );
    } catch (e) {
      this.getError(e);
    }
  }

  async getFileContents() {
    try {
      const res = await fs.readFile(`${this.localPath}/${this.table}.json`);
      const stringContent = res.toString();

      const parsed = JSON.parse(stringContent);

      return parsed;
    } catch (e) {
      this.getError(e);
    }
  }

  async getDbCollection(path) {
    try {
      const contents = await this.getFileContents(
        `${this.localPath}/${this.table}.json`
      );
      return contents;
    } catch (e) {
      this.getError(e);
    }
  }

  async updateOne() {
    try {
      const res = await super.updateOne();
      await this.writeToFile(JSON.stringify(res), { flag: "w" });
    } catch (e) {
      this.getError(e);
    }
  }

  async updateMany() {
    try {
      const res = await super.updateMany();
      await this.writeToFile(JSON.stringify(res), { flag: "w" });
    } catch (e) {
      this.getError(e);
    }
  }

  async insert(options) {
    try {
      const res = await super.insert();

      await this.writeToFile(JSON.stringify(res), options);
    } catch (e) {
      this.getError(e);
    }
  }

  async deleteOne() {
    try {
      const res = await super.deleteOne();
      await this.writeToFile(JSON.stringify(res), null);
    } catch (e) {
      this.getError(e);
    }
  }

  async deleteMany() {
    try {
      const res = await super.deleteMany();

      await this.writeToFile(JSON.stringify(res), null);
    } catch (e) {
      this.getError(e);
    }
  }
};
