const mergeObjects = require("../utils/mergeObjects");
const { matchCondition } = require("../utils/filterData");

async function updateOne({ initialData, filters, queries, runPostParser }) {
  let payload;
  for (const record of initialData) {
    if (!matchCondition(record, filters).includes(false)) {
      payload = [mergeObjects([record, queries["_set"]])];

      break;
    }
  }

  const parsedPayload = runPostParser(payload);

  return {
    data: mergeCopyAndOriginal(initialData, parsedPayload),
    payload: parsedPayload,
  };
}

async function updateMany({ initialData, filters, queries }) {
  let count = 0;

  const payload = initialData
    .map((record) => {
      if (!matchCondition(record, filters).includes(false)) {
        count++;
        return mergeObjects([record, queries["_set"]]);
      }
    })
    .filter((record) => !!record);

  return {
    data: mergeCopyAndOriginal(initialData, payload),
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
