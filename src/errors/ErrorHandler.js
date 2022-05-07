module.exports = class ErrorHandler extends Error {
  constructor(e, options = { mode: null, msg: null }) {
    super(e);
    const { mode, msg } = options;
    this.error = e;
    this.mode = "log";
    this.msg = msg;
    this.handle();
  }

  handle() {
    console.log("ERROR", this.error);
    switch (this.mode) {
      case "log":
        console.log(this.msg || this.error);
      default:
        throw this.error;
    }
  }
};
