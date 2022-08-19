const stringifyPath = require("../utils/stringifyPath");
const getObjectValue = require("../utils/getObjectValue");
const objectFromString = require("../utils/objectFromString");
const modifyObjectProperty = require("../utils/modifyObjectProperty");
const mergeObjects = require("../utils/mergeObjects");

const copyObjectProperty = (str, origin) => {
  return objectFromString(str, getObjectValue(str, origin));
};

const deleteKey = (object, keys) => {
  try {
    const last = keys.pop();
    delete keys.reduce((o, k) => o[k] !== undefined && o[k], object)[last];
    return object;
  } catch (e) {
    console.error(e);
  }
};

exports.PRIORITIES = {
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

exports._skip = ({ data, queries }) =>
  !data.length ? [] : data.slice(queries["_skip"]);

exports._limit = ({ data, queries }) =>
  !data.length ? [] : data.slice(0, queries["_limit"]);

exports._array_slice = ({ data, queries }) => {
  const [props, array_slice] = stringifyPath(queries["_array_slice"]);

  return data.map((rec) =>
    modifyObjectProperty(props, rec, (v) =>
      Array.isArray(v) ? v.slice(0, array_slice) : v
    )
  );
};

exports._inc = ({ data, queries }) => {
  const [dottedProps, inc] = stringifyPath(queries["_inc"]);

  return data.map((rec) =>
    modifyObjectProperty(dottedProps, rec, (v) => v + inc)
  );
};

exports._cdate = ({ data, queries }) => {
  const [dottedProps, type] = stringifyPath(queries["_cdate"]);

  return data.map((record) =>
    modifyObjectProperty(
      dottedProps.split(".").slice(0, -1).join("."),
      record,
      type === "timestamp" ? Date.now() : new Date()
    )
  );
};

exports._slice = ({ data, queries }) => {
  const { _slice: s } = queries;

  return data.length ? data.slice(s[0], s[0] + s[1]) : [];
};

exports._except = ({ data, queries }) => {
  const { _only: only, _except: except } = queries;

  if (!data.length) return [];

  if (only) {
    throw new Error(`'only' and 'except' cannot be used in the same request`);
  }

  for (const [k, v] of data.entries()) {
    data[k] = except.map((prop) => deleteKey(v, prop.split(".")))[0];
  }

  return data;
};

exports._only = ({ data, queries }) => {
  const { _except: except, _only: only } = queries;

  if (!data.length) return [];

  if (except) {
    throw new Error(`'only' and 'except' cannot be used in the same request`);
  }

  only.push("_id");

  for (const [k, v] of data.entries()) {
    data[k] = only
      .map((prop) => copyObjectProperty(prop, v))
      .reduce((acc, curr) => mergeObjects([acc, curr]), {});
  }

  return data;
};

exports._sort = ({ data, queries }) => {
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
};
