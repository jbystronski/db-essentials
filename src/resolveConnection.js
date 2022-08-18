module.exports = function resolveConnection(mode) {
  try {
    switch (true) {
      default:
        return require("./classes/LocalConnection");
    }
  } catch (error) {
    throw new Error(error);
  }
};
