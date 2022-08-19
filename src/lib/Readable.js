const { matchCondition } = require("../utils/filterData");

async function findOne({ initialData, filters, runPostParser }) {
  let found = null;
  let copy = JSON.parse(JSON.stringify(initialData));

  for (const record of copy) {
    if (!matchCondition(record, filters).includes(false)) {
      found = true;
      copy = [record];
      break;
    }
  }

  return {
    payload: !found ? null : runPostParser(copy)[0],
  };
}

async function find({ initialData, filters, runPostParser }) {
  const payload = filters
    ? initialData.filter(
        (current) => !matchCondition(current, filters).includes(false)
      )
    : initialData;

  console.log("pd in find", payload);

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
