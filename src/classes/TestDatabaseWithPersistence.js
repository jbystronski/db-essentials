const TestDatabase = require("./TestDatabase");
const fs = require("fs").promises;

module.exports = class TestDatabaseWithPersistence extends TestDatabase {
  constructor(props) {
    super(props);
  }

  async fileExists() {
    try {
      const result = await fs.lstat(
        `${this.config.localPath}/${this.table}.json`
      );
      return result;
    } catch (e) {
      throw new Error("File does not exists");
    }
  }

  async writeToFile(content, options = {}) {
    try {
      await fs.writeFile(
        `${this.config.localPath}/${this.table}.json`,
        content,
        options
      );
    } catch (e) {
      throw new Error(e);
    }
  }

  async getFileContents() {
    try {
      const res = await fs.readFile(
        `${this.config.localPath}/${this.table}.json`
      );
      const stringContent = res.toString();

      const parsed = JSON.parse(stringContent);

      return parsed;
    } catch (e) {
      throw new Error(e);
    }
  }

  async getDbCollection(path) {
    try {
      const contents = await this.getFileContents(
        `${this.config.localPath}/${this.table}.json`
      );
      return contents;
    } catch (e) {
      throw new Error(`Table doesn't exist`);
    }
  }

  async updateOne() {
    try {
      const res = await super.updateOne();
      await this.writeToFile(JSON.stringify(res), { flag: "w" });
    } catch (e) {
      throw new Error(e);
    }
  }

  async updateMany() {
    try {
      const res = await super.updateMany();
      await this.writeToFile(JSON.stringify(res), { flag: "w" });
    } catch (e) {
      throw new Error(e);
    }
  }

  async insert(options) {
    try {
      const res = await super.insert();

      await this.writeToFile(JSON.stringify(res), options);
    } catch (e) {
      throw new Error(e);
    }
  }

  async deleteOne() {
    try {
      const res = await super.deleteOne();
      await this.writeToFile(JSON.stringify(res), null);
    } catch (e) {
      throw new Error(e);
    }
  }

  async deleteMany() {
    try {
      const res = await super.deleteMany();
      console.log("in persistent delete", res);
      await this.writeToFile(JSON.stringify(res), null);
    } catch (e) {
      throw new Error(e);
    }
  }
};
