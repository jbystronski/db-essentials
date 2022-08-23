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
    save: data,
    payload: toDelete,
  };
}

async function deleteMany({ data, filters }) {
  const deletedIds = [];
  const filtered = data.map((record) => {
    if (matchCondition(record, filters).includes(false)) return record;
    deletedIds.push(record._id);
  });

  return {
    save: filtered,
    payload: deletedIds,
  };
}

module.exports = { deleteOne, deleteMany };
