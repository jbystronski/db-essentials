const { matchCondition } = require("../utils/filterData");

exports._nor = ({ data, queries: { _nor } }) =>
  data.filter((record) => !matchCondition(record, _nor).includes(true));

exports._or = ({ data, queries: { _or } }) =>
  data.filter((record) => matchCondition(record, _or).includes(true));

exports._and = ({ data, queries: { _and } }) =>
  data.filter((record) => !matchCondition(record, _and).includes(false));
