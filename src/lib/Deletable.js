const { matchCondition } = require("../utils/filterData");

async function deleteOne({ data, filters }) {
  let toDelete = null;

  for (const record of data) {
    if (!matchCondition(record, filters).includes(false)) {
      const index = data.indexOf(record);
      toDelete = data[index];
      data.splice(index, 1);

      break;
    }
  }

  return {
    save: copy,
    payload: toDelete,
  };
}

async function deleteMany({ data, filters }) {
  const filtered = data.filter((record) =>
    matchCondition(record, filters).includes(false)
  );

  return {
    save: filtered,
    payload: `Deleted records cound: ${data.length - filtered.length}`,
  };
}

module.exports = { deleteOne, deleteMany };
