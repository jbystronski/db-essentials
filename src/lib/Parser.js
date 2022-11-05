const mergeObjects = require("../utils/mergeObjects");
const objectFromString = require("../utils/objectFromString");
const isStringNumeric = require("../utils/isStringNumeric");
const INITIAL_FILTERS = require("./InitialFilters");
const InitialParsers = require("./InitialParsers");
const PostParsers = require("./PostParsers");

const dbMethods = {
  ...require("./Writeable"),
  ...require("./Deletable"),
  ...require("./Readable"),
  ...require("./Updateable"),
};

const Writeable = Object.keys(require("./Writeable"));

const CRUD_ACTIONS = {
  save_one: "insert",
  save_many: "insert",
  find: "find",
  find_one: "findOne",
  update_one: "updateOne",
  update_many: "updateMany",
  delete_one: "deleteOne",
  delete_many: "deleteMany",
  count: "count",
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

const mapStringValue = (v, k) => {
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
      const parsedValue = mapStringValue(v, k);
      let kparts = k.split(".");

      if (kparts.length === 1) {
        container[kparts[0]] = parsedValue;
      } else {
        if (INITIAL_FILTERS.includes(kparts[0])) {
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

const runParserFunctions = (queue, data, queries) => {
  if (queue.length) {
    try {
      for (const fn of queue) {
        data = fn({
          data: data,
          queries: queries,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  return data;
};

const create = (collection, params, body) => {
  return {
    collection,
    params,
    body,

    async run(action) {
      let queries = {};
      const filters = {};
      const postParsersQueueOrder = [];
      const initialParsersQueue = [];
      const postParsersQueue = [];

      try {
        if (
          !Writeable.includes(CRUD_ACTIONS[action]) &&
          !this.collection.length
        )
          return `This method won't work with non-existing collection, aborting`;

        if (params) {
          queries = parseParams(params);
        }

        if (this.body) {
          queries = { ...queries, ...this.body };
        }

        for (const [k, v] of Object.entries(queries)) {
          if (k in InitialParsers) initialParsersQueue.push(InitialParsers[k]);

          if (k in PostParsers) postParsersQueueOrder.push(k);
        }

        postParsersQueueOrder
          .sort((a, b) =>
            PostParsers.PRIORITIES[a] > PostParsers.PRIORITIES[b] ? 1 : -1
          )
          .forEach((fnKey) => {
            fnKey in PostParsers && postParsersQueue.push(PostParsers[fnKey]);
          });

        if ("_save" in queries) {
          filters["_save"] = JSON.parse(JSON.stringify(queries["_save"]));
          delete queries["_save"];
        }

        for (const key of Object.keys(queries)) {
          if (!isOperator(key)) {
            filters[key] = JSON.parse(JSON.stringify(queries[key]));
            delete queries[key];
          }
        }

        if (action in CRUD_ACTIONS && CRUD_ACTIONS[action] in dbMethods) {
          const method = dbMethods[CRUD_ACTIONS[action]];

          return await method({
            data: runParserFunctions(
              initialParsersQueue,
              this.collection,
              queries
            ),
            filters: filters,
            queries: queries,
            runPostParser: (data) =>
              runParserFunctions(postParsersQueue, data, queries),
          });
        }
        return `Unknown operation: ${action}`;
      } catch (e) {
        console.error(e);
      }
    },
  };
};

module.exports = { create };
