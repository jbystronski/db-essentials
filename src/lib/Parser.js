const mergeObjects = require("../utils/mergeObjects");
const isType = require("../utils/isType");
const objectFromString = require("../utils/objectFromString");
const isStringNumeric = require("../utils/isStringNumeric");
const checkType = require("../utils/checkType");
const stringifyPath = require("../utils/stringifyPath");
const getObjectValue = require("../utils/getObjectValue");

const INITIAL_PARSER_FUNCTIONS = { _or: _or, _nor: _nor, _and: _and };

const AFTER_PARSER_FUNCTIONS = {
  _array_slice: _array_slice,
  _cdate: _cdate,
  _except: _except,
  _inc: _inc,
  _limit: _limit,
  _only: _only,
  _skip: _skip,
  _slice: _slice,
  _sort: _sort,
};

const PREFILTER_FUNCTIONS = [
  "_array_all",
  "_array_match",
  "_array_size",
  "_equals",
  "_exists",
  "_gt",
  "_gte",
  "_in",
  "_lt",
  "_lte",
  "_not_equal",
  "_not_in",
  "_regex",
  "_type",
];

const AFTER_PARSER_PRIORITIES = {
  _sort: 1,
  _skip: 2,
  _limit: 3,
  _only: 4,
  _except: 4,
  _inc: 5,
  _cdate: 5,
  _slice: 5,
  _array_slice: 5,
};

const ARRAY_KEYS = [
  "_array_all",
  "_except",
  "_in",
  "_not_in",
  "_only",
  "_slice",
];

const isOperator = (key) => key.startsWith("_") && key !== "_id";

const copyObjectProperty = (str, origin) => {
  return objectFromString(str, getObjectValue(str, origin));
};

const parseValue = (v, k) => {
  if (typeof v !== "string") return v;

  // is value comma separated , if so turn into array
  try {
    const values = v.split(",");

    const patterns = {
      true: true,
      false: false,
      null: null,
      undefined: undefined,
    };

    for (const [k, v] of values.entries()) {
      if (v in patterns) {
        values[k] = patterns[v];
      }

      // check if values are integers
      if (isStringNumeric(v)) {
        values[k] = parseFloat(v);
      }
    }

    // check if key indicates that this param is an array, and return

    return k && ARRAY_KEYS.includes(k.split(".").reverse()[0])
      ? values
      : values[0];
  } catch (e) {
    console.error(e);
  }
};

const parseParams = (params, container = {}) => {
  try {
    for (const [index, param] of params.entries()) {
      let [k, v] = param.split("=");
      const parsedValue = parseValue(v, k);
      let kparts = k.split(".");

      if (kparts.length === 1) {
        container[kparts[0]] = parsedValue;
      } else {
        if (PREFILTER_FUNCTIONS.includes(kparts[0])) {
          if (!container.hasOwnProperty(kparts[0])) {
            container[kparts[0]] = [];
          }

          container[kparts[0]] = [
            ...container[kparts[0]],
            objectFromString(kparts.slice(1), parsedValue),
          ];
        } else {
          container[kparts[0]] = mergeObjects([
            container[kparts[0]],
            objectFromString(kparts.slice(1), parsedValue),
          ]);
        }
      }
    }
    return container;
  } catch (e) {
    console.error(e);
  }
};

function filterData(record, filters, parentKey, matches = []) {
  if (!Object.keys(filters).length) return [true];

  try {
    for (const [k, v] of Object.entries(filters)) {
      isType(v, "object")
        ? filterData(
            isType(record[k], "object") ? record[k] : record,
            v,
            k,
            matches
          )
        : PREFILTER_FUNCTIONS.includes(k)
        ? matches.push(
            getFilterFunction(k, v, record[parentKey]) ? true : false
          )
        : matches.push(record[k] === v || false);
    }

    return matches;
  } catch (e) {
    console.error(e);
  }
}

function deleteKey(object, keys) {
  try {
    const last = keys.pop();
    delete keys.reduce((o, k) => o[k] !== undefined && o[k], object)[last];
    return object;
  } catch (e) {
    console.error(e);
  }
}

function _skip({ data, queries }) {
  if (!data.length) return [];

  return data.slice(queries["skip"]);
}

function _limit({ data, queries }) {
  if (!data.length) return [];

  return data.slice(0, queries["limit"]);
}

function _array_slice({ data, queries }) {
  const [props, array_slice] = stringifyPath(queries["_array_slice"]);

  return data.map((rec) =>
    modifyObjectProperty(props, rec, (v) =>
      Array.isArray(v) ? v.slice(0, array_slice) : v
    )
  );
}

function _inc({ data, queries }) {
  const [dottedProps, inc] = stringifyPath(queries["_inc"]);

  return data.map((rec) =>
    modifyObjectProperty(dottedProps, rec, (v) => v + inc)
  );
}

function _cdate({ data, queries }) {
  const [dottedProps, type] = stringifyPath(queries["_cdate"]);

  return data.map((record) =>
    modifyObjectProperty(
      dottedProps.split(".").slice(0, -1).join("."),
      record,
      type === "timestamp" ? Date.now() : new Date()
    )
  );
}

function _slice({ data, queries }) {
  const { _slice: s } = queries;

  return data.length ? data.slice(s[0], s[0] + s[1]) : [];
}

function _nor({ data, queries }) {
  const { _nor: nor } = queries;

  if (!data.length) return [];

  Array.isArray(nor)
    ? nor.forEach((condition) => {
        data = data.filter((record) => !filter(record, condition, true));
      })
    : (data = data.filter((record) => !filter(record, nor, true)));

  return data;
}

function _except({ data, queries }) {
  const { _only: only, _except: except } = queries;

  if (!data.length) return [];

  if (only) {
    throw new Error(`'only' and 'except' cannot be used in the same request`);
  }

  for (const [k, v] of data.entries()) {
    data[k] = except.map((prop) => deleteKey(v, prop.split(".")))[0];
  }

  return data;
}

function _only({ data, queries }) {
  const { _except: except, _only: only } = queries;

  if (!data.length) return [];

  if (except) {
    throw new Error(`'only' and 'except' cannot be used in the same request`);
  }

  // Return _id value always

  only.push("_id");

  for (const [k, v] of data.entries()) {
    data[k] = only
      .map((prop) => copyObjectProperty(prop, v))
      .reduce((acc, curr) => mergeObjects([acc, curr]), {});
  }

  return data;
}

function _or({ data, queries }) {
  const { _or: or } = queries;

  if (!data.length) return [];

  let found = [];

  Array.isArray(or)
    ? or.forEach((condition) => {
        const match = data.filter((record) => filter(record, condition, true));

        found.indexOf(...match) === -1 && found.push(...match);
      })
    : (found = data.filter((record) => filter(record, or, true)));

  return found;
}

function _sort({ data, queries }) {
  const { _sort: query } = queries;

  if (!data.length) return null;

  const compare = (a, b, dir) => {
    if (a < b) {
      return dir === -1 ? 1 : -1;
    }
    if (a > b) {
      return dir === -1 ? -1 : 1;
    }
    return 0;
  };

  for (const sortKey in query) {
    data.sort((a, b) => compare(a[sortKey], b[sortKey], query[sortKey]));
  }

  return data;
}

const filter = (record, criteria, condition = false) =>
  filterData(record, criteria).includes(condition);

function _and({ data, queries }) {
  const { _and: and } = queries;
  if (!data.length) return;

  Array.isArray(and)
    ? and.forEach((condition) => {
        data = data.filter((record) => !this.filter(record, condition, false));
      })
    : (data = data.filter((record) => !this.filter(record, and, false)));

  return data;
}

function getFilterFunction(fName, check, v) {
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

const create = (data, params = null, body = null) => {
  return {
    data,
    params,
    body,
    queryObject: {},
    filtersObject: {},
    initialParsersQueue: [],
    afterParsersQueue: [],

    async run() {
      try {
        if (params) {
          this.queryObject = parseParams(params);
        }

        this.queryObject = this.body
          ? { ...this.queryObject, ...this.body }
          : this.queryObject;
        delete this.body;

        Object.keys(this.queryObject).forEach((key) => {
          Object.keys(INITIAL_PARSER_FUNCTIONS).includes(key) &&
            this.initialParsersQueue.push(key);

          Object.keys(AFTER_PARSER_FUNCTIONS).includes(key) &&
            this.afterParsersQueue.push(key);
        });
        // console.log(data);
        // return;
        this.afterParsersQueue.sort((a, b) =>
          AFTER_PARSER_PRIORITIES[a] > AFTER_PARSER_PRIORITIES[b] ? 1 : -1
        );

        for (const key of Object.keys(this.queryObject)) {
          if (key === "_save") {
            this.filtersObject[key] = JSON.parse(
              JSON.stringify(this.queryObject["_save"])
            );
            delete this.queryObject["_save"];
          } else if (!isOperator(key)) {
            this.filtersObject[key] = JSON.parse(
              JSON.stringify(this.queryObject[key])
            );
            delete this.queryObject[key];
          }
        }
        return this;
      } catch (e) {
        console.error(e);
      }
    },

    runInitialParsing() {
      try {
        this.copy = JSON.parse(JSON.stringify(this.data));
        for (const fn of this.initialParsersQueue) {
          this.copy = INITIAL_PARSER_FUNCTIONS[fn]({
            data: this.copy,
            queries: this.queryObject,
          });
        }
        return this.copy;
      } catch (e) {
        console.error(e);
      }
    },

    runPostParsers() {
      try {
        for (const fn of this.afterParsersQueue) {
          this.copy = AFTER_PARSER_FUNCTIONS[fn]({
            data: this.copy,
            queries: this.queryObject,
          });
        }
        return this.copy;
      } catch (e) {
        console.error(e);
      }
    },

    async find() {
      this.copy = this.runInitialParsing();

      if (this.filtersObject) {
        this.copy = this.copy.filter(
          (current) => !filter(current, this.filtersObject)
        );
      }
      return {
        payload: this.runPostParsers(),
      };
    },

    async findOne() {
      let found = false;

      this.copy = this.runInitialParsing();

      for (const record of this.copy) {
        if (!filter(record, this.filtersObject)) {
          found = true;
          this.copy = [record];
          break;
        }
      }

      return {
        payload: !found ? null : this.runPostParsers()[0],
      };
    },

    async updateMany() {
      this.copy = this.runInitialParsing();

      let count = 0;

      this.copy = this.copy
        .map((record) => {
          if (!filter(record, this.filtersObject)) {
            count++;
            return mergeObjects([record, this.queryObject["_set"]]);
          }
        })
        .filter((record) => !!record);
      console.log(this.copy);

      return {
        data: mergeCopyAndOriginal(this.data, this.copy),
        payload: `Updated records: ${count}`,
      };
    },

    async updateOne() {
      this.copy = this.runInitialParsing();

      for (const record of this.copy) {
        if (!filter(record, this.filtersObject)) {
          this.copy = [mergeObjects([record, this.queryObject["_set"]])];

          break;
        }
      }

      this.copy = this.runPostParsers();

      return {
        data: mergeCopyAndOriginal(this.data, this.copy),
        payload: this.copy,
      };
    },

    async insert() {
      const data = this.data;

      const inserted =
        "_save" in this.filtersObject &&
        Array.isArray(this.filtersObject["_save"])
          ? this.filtersObject["_save"]
          : [this.filtersObject];

      let lastId = data.length ? data[data.length - 1]["_id"] + 1 : 1;

      inserted.forEach((el) => {
        el["_id"] = lastId;
        lastId++;
      });

      return {
        data: [...data, ...inserted],
        payload: inserted,
      };
    },

    async deleteOne() {
      const data = this.runInitialParsing();
      let toDelete = null;

      for (const record of data) {
        if (!filter(record, this.filtersObject)) {
          const index = data.indexOf(record);
          toDelete = data[index];
          data.splice(index, 1);

          break;
        }
      }

      return {
        data: this.copy,
        payload: toDelete,
      };
    },

    async deleteMany() {
      const data = this.runInitialParsing();

      const filtered = data.filter((record) =>
        filter(record, this.filtersObject)
      );

      return {
        data: filtered,
        payload: `Deleted records cound: ${data.length - filtered.length}`,
      };
    },

    async count() {
      const res = (await this.find()) || [];

      return {
        payload: res.length,
      };
    },
  };
};

module.exports = { create };
