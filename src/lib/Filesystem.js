const fs = require("fs").promises;

async function fileExists(path) {
  try {
    return await fs.lstat(path);
  } catch (e) {
    console.error(e);
  }
}

async function persist(data, path, options = {}) {
  try {
    await fs.writeFile(path, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

async function getFileContents(path) {
  try {
    const result = await fs.readFile(path);

    return JSON.parse(result.toString());
  } catch (e) {
    console.error(error);
  }
}

module.exports = { persist };
