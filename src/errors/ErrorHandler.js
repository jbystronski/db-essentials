module.exports = class ErrorHandler extends Error {
  constructor(e, config = { msg: null }) {
    super(e);
    this.error = e;

    this.msg = config.msg || e.message;
    this.handle();
  }

  handle() {
    this.error.message = this.message;
    throw this.error;
  }
};
