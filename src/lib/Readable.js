const { matchCondition } = require("../utils/filterData");

async function findOne({ data, filters, runPostParser }) {
  let found;

  for (const record of data) {
    if (!matchCondition(record, filters).includes(false)) {
      found = record;
      break;
    }
  }

  return {
    payload: found ? runPostParser([found])[0] : null,
  };
}

async function find({ data, filters, runPostParser }) {
  const payload = filters
    ? data.filter(
        (current) => !matchCondition(current, filters).includes(false)
      )
    : data;

  return {
    payload: runPostParser(payload),
  };
}

async function count({ data, filters, runPostParser }) {
  const { payload } = await find({ data, filters, runPostParser });

  return {
    payload: payload.length,
  };
}

module.exports = { findOne, find, count };
