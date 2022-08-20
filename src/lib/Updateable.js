const mergeObjects = require("../utils/mergeObjects");
const { matchCondition } = require("../utils/filterData");

async function updateOne({ data, filters, queries: { _set }, runPostParser }) {
  let payload;
  for (const record of data) {
    if (!matchCondition(record, filters).includes(false)) {
      payload = [mergeObjects([record, _set])];

      break;
    }
  }

  const updated = runPostParser(payload);

  return {
    save: mergeCopyAndOriginal(data, updated),
    payload: updated,
  };
}

async function updateMany({ data, filters, queries: { _set } }) {
  let count = 0;

  const payload = data
    .map((record) => {
      if (!matchCondition(record, filters).includes(false)) {
        count++;
        return mergeObjects([record, _set]);
      }
    })
    .filter((record) => !!record);

  return {
    save: mergeCopyAndOriginal(data, payload),
    payload: `Updated records: ${count}`,
  };
}

const mergeCopyAndOriginal = (origin, copy) => {
  try {
    const modifiedIndices = copy.reduce((acc, rec) => [...acc, rec["_id"]], []);

    return origin.reduce((acc, curr) => {
      !modifiedIndices.includes(curr["_id"])
        ? acc.push(curr)
        : acc.push(copy.find((el) => el["_id"] === curr["_id"]));

      return acc;
    }, []);
  } catch (e) {
    console.error(e);
  }
};

module.exports = { updateOne, updateMany };
