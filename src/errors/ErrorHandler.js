module.exports = class ErrorHandler {
  constructor(e, config = { msg: null }) {
    this.error = e || new Error();

    this.msg = config.msg || e.message;
    this.handle();
  }

  handle() {
    this.error.message = this.msg;
    throw this.error;
  }
};
