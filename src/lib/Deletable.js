const { matchCondition } = require("../utils/filterData");

async function deleteOne({ initialData, filters }) {
  const copy = JSON.parse(JSON.stringify(initialData));
  let toDelete = null;

  for (const record of initialData) {
    if (!filter(record, filters)) {
      const index = initialData.indexOf(record);
      toDelete = initialData[index];
      copy.splice(index, 1);

      break;
    }
  }

  return {
    data: copy,
    payload: toDelete,
  };
}

async function deleteMany({ initialData, filters }) {
  const filtered = initialData.filter((record) =>
    matchCondition(record, filters).includes(false)
  );

  return {
    data: filtered,
    payload: `Deleted records cound: ${initialData.length - filtered.length}`,
  };
}

module.exports = { deleteOne, deleteMany };
