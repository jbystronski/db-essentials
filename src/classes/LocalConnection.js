const fs = require("fs").promises;
const Connection = require("./Connection");

module.exports = class LocalConnection extends Connection {
  constructor(config, mode) {
    super(config, mode);

    this.collections = [];
  }

  async establishConnection() {
    try {
      for (const file of await fs.readdir(this.db)) {
        const contents = await fs.readFile(`${this.db}/${file}`);
        const t = file.replace(".json", "");
        this.collections[t] = JSON.parse(contents);
      }

      return this;
    } catch (error) {
      throw new Error(error);
    }
  }
};
