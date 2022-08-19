const INITIAL_FILTERS = require("../lib/InitialFilters");
const isType = require("./isType");

exports.matchCondition = function (record, filters, parentKey, matches = []) {
  if (!Object.keys(filters).length) return [true];

  try {
    for (const [k, v] of Object.entries(filters)) {
      isType(v, "object")
        ? exports.matchCondition(
            isType(record[k], "object") ? record[k] : record,
            v,
            k,
            matches
          )
        : INITIAL_FILTERS.includes(k)
        ? matches.push(
            getFilterFunction(k, v, record[parentKey]) ? true : false
          )
        : matches.push(record[k] === v || false);
    }

    return matches;
  } catch (e) {
    console.error(e);
  }
};

const getFilterFunction = (fName, check, v) => {
  try {
    const fns = {
      _in: () => check.includes(v),
      _not_in: () => !check.includes(v),
      _not_equal: () => v !== check,
      _gt: () => v > check,
      _lt: () => v < check,
      _gte: () => v >= check,
      _lte: () => v <= check,
      _equals: () => v === check,
      _type: () => isType(v, check),
      _regex: () => {
        const split = check.split("/").filter((el) => el !== "");

        return v.match(new RegExp(split[0], split[1]));
      },
      _array_all: () => {
        if (Array.isArray(v) && Array.isArray(check)) {
          return !check
            .reduce(
              (acc, curr) =>
                v.includes(curr) ? [...acc, true] : [...acc, false],
              []
            )
            .includes(false);
        }
        return false;
      },
      _array_size: () => (!Array.isArray(v) ? false : v.length === check),
      _array_match: () => Array.isArray(v) && v.includes(check),
      _exists: () => (check === true ? v !== undefined : v === undefined),
    };

    return fns[fName]();
  } catch (e) {
    console.error(e);
  }
};
