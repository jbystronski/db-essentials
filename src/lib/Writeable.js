async function insert({ initialData, filters }) {
  const inserted =
    "_save" in filters && Array.isArray(filters["_save"])
      ? filters["_save"]
      : [filters];

  let lastId = initialData.length
    ? initialData[initialData.length - 1]["_id"] + 1
    : 1;

  inserted.forEach((el) => {
    el["_id"] = lastId;
    lastId++;
  });

  return {
    data: [...initialData, ...inserted],
    payload: inserted,
  };
}

module.exports = { insert };
