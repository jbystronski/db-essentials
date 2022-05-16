const path = require("path");

module.exports = class Connection {
  constructor(config, mode) {
    this.isCached = false;
    this.isConnected = false;
    this.mode = mode;
    this.db = path.resolve(config.database);
  }

  async establishConnection() {
    try {
      this.isConnected = true;
      this.isCached = true;

      return this;
    } catch (error) {
      throw new Error(error);
    }
  }
};
