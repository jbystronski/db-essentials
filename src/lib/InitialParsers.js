const { matchCondition } = require("../utils/filterData");

exports._nor = ({ data = [], queries: { _nor } }) => {
  Array.isArray(nor)
    ? _nor.forEach((condition) => {
        data = data.filter(
          (record) => !matchCondition(record, condition).includes(true)
        );
      })
    : (data = data.filter(
        (record) => !matchCondition(record, _nor).includes(true)
      ));

  return data;
};

exports._or = ({ data = [], queries: { _or } }) => {
  let found = [];

  Array.isArray(_or)
    ? _or.forEach((condition) => {
        const match = data.filter((record) =>
          matchCondition(record, condition).includes(true)
        );

        found.indexOf(...match) === -1 && found.push(...match);
      })
    : (found = data.filter((record) =>
        matchCondition(record, _or).includes(true)
      ));

  return found;
};

exports._and = ({ data = [], queries: { _and } }) => {
  Array.isArray(and)
    ? _and.forEach((condition) => {
        data = data.filter(
          (record) => !matchCondition(record, condition).includes(false)
        );
      })
    : (data = data.filter(
        (record) => !matchCondition(record, _and).includes(false)
      ));

  return data;
};
