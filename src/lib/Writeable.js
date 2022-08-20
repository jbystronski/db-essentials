async function insert({ data, filters }) {
  const toSave =
    "_save" in filters && Array.isArray(filters["_save"])
      ? filters["_save"]
      : [filters];

  let lastId = data.length ? data[data.length - 1]["_id"] + 1 : 1;

  toSave.forEach((el) => {
    el["_id"] = lastId;
    lastId++;
  });

  return {
    save: [...data, ...toSave],
    payload: toSave,
  };
}

module.exports = { insert };
