const { filterData: matchCondition } = require("../utils/filterData");

exports._nor = ({ data, queries }) => {
  const { _nor: nor } = queries;

  if (!data.length) return [];

  Array.isArray(nor)
    ? nor.forEach((condition) => {
        data = data.filter(
          (record) => !matchCondition(record, condition).includes(true)
        );
      })
    : (data = data.filter(
        (record) => !matchCondition(record, nor).includes(true)
      ));

  return data;
};

exports._or = ({ data, queries }) => {
  const { _or: or } = queries;

  if (!data.length) return [];

  let found = [];

  Array.isArray(or)
    ? or.forEach((condition) => {
        const match = data.filter((record) =>
          matchCondition(record, condition).includes(true)
        );

        found.indexOf(...match) === -1 && found.push(...match);
      })
    : (found = data.filter((record) =>
        matchCondition(record, or).includes(true)
      ));

  return found;
};

exports._and = ({ data, queries }) => {
  const { _and: and } = queries;
  if (!data.length) return;

  Array.isArray(and)
    ? and.forEach((condition) => {
        data = data.filter(
          (record) => !matchCondition(record, condition).includes(false)
        );
      })
    : (data = data.filter(
        (record) => !matchCondition(record, and).includes(false)
      ));

  return data;
};
