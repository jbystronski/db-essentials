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
    payload: found ? runPostParser([found]) : null,
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

async function count() {
  const res = (await find()) || [];

  return {
    payload: res.length,
  };
}

module.exports = { findOne, find, count };
