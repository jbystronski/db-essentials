const path = require("path");

module.exports = class Connection {
  constructor(config, mode) {
    this.isCached = false;
    this.isConnected = false;
    this.mode = mode;
    this.db = config.database
      ? path.resolve(config.database)
      : path.resolve(__dirname, "./../../example/test_files");

    this.instance = {};
  }

  async establishConnection() {
    try {
      console.log("establishing connection");
      this.isConnected = true;

      if (this.isConnected) {
        this.isCached = true;
      }

      return this;
    } catch (error) {
      throw new Error(error);
    }
  }
};
