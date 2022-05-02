const Parser = require("./Parser");

module.exports = class LocalParser extends Parser {
  constructor(params, body, data) {
    super(params, body);

    this.data = data;
    this.copy = [];

    this.reservedFilterKeywords = [
      "_contains",
      "_equals",
      "_in",
      "_not",
      "_not_in",
      "_gt",
      "_min",
      "_lt",
      "_max"
    ];
  }

  filterFunctions(fName, compare, value) {
    try {
      const fns = {
        _in: () => compare.includes(value),
        _contains: () => value.includes(compare),
        _not_in: () => !value.includes(compare),
        _not: () => value !== compare,
        _gt: () => value > compare,
        _lt: () => value < compare,
        _min: () => value >= compare,
        _max: () => value <= compare,
        _equals: () => value === compare
      };

      return fns[fName]();
    } catch (e) {
      throw new Error(e);
    }
  }

  filterData(record, filters, parentKey, matches = []) {
    if (!Object.keys(filters).length) return true;

    try {
      for (const [k, v] of Object.entries(filters)) {
        this.isType(v, "object")
          ? this.filterData(
              this.isType(record[k], "object") ? record[k] : record,
              v,
              k,
              matches
            )
          : this.reservedFilterKeywords.includes(k)
          ? matches.push(
              this.filterFunctions(k, v, record[parentKey]) ? true : false
            )
          : matches.push(record[k] === v ? true : false);
      }

      return matches.includes(false) ? false : record;
    } catch (error) {
      throw new Error(error);
    }
  }

  recursiveKeys(obj, container = [], previousKey = "") {
    try {
      Object.entries(obj).forEach(([key, values]) => {
        let keyRes = previousKey ? `${previousKey}.${key}` : key;
        if (this.isType(values, "object"))
          this.recursiveKeys(values, container, keyRes);

        container.push(keyRes);
      });

      return container;
    } catch (error) {
      throw new Error(error);
    }
  }

  _limit() {
    if (!this.copy.length) return;
    try {
      const limit = this.getQueryProp("_limit");

      if (typeof limit !== "number") {
        console.error(`"limit" must be a number, got ${typeof limit}`);
        return;
      }

      const startIndex = this.getQueryProp("_skip") || 0;

      this.copy = this.copy.splice(startIndex, limit);
    } catch (error) {
      throw new Error(error);
    }
  }

  _skip() {
    if (!this.copy.length) return;
    try {
      const skip = this.getQueryProp("_skip");

      if (typeof skip !== "number") {
        console.error(`"skip" must be a number, got ${typeof skip}`);
        return;
      }

      this.copy = this.copy.splice(skip);
    } catch (error) {
      throw new Error(error);
    }
  }

  _only() {
    if (!this.copy.length) return;
    try {
      if (this.getQueryProp("_except")) {
        throw new Error(`'only' and 'except' cannot be used in the same query`);
      }

      const only = this.getQueryProp("_only");

      const keysToInclude = Array.isArray(only) ? only : [only];

      keysToInclude.push("_id");

      for (const record of this.copy) {
        this.include(record, keysToInclude);
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  include(record, keysToInclude) {
    try {
      const keysToIncludeWithParentKeys = [];
      keysToInclude.forEach((key) => {
        const split = key.split(".");
        if (split.length > 1) {
          let count = split.length;
          while (count !== 0) {
            const k = split.slice(0, count).join(".");
            !keysToIncludeWithParentKeys.includes(k) &&
              keysToIncludeWithParentKeys.push(k);

            count--;
          }
        } else {
          keysToIncludeWithParentKeys.push(split[0]);
        }
      });

      const keysToDelete = this.recursiveKeys(record)
        .sort()
        .filter((k) => !keysToIncludeWithParentKeys.includes(k));

      for (const [k, v] of keysToDelete.entries()) {
        this.deleteKey(record, v.split("."));
      }

      return record;
    } catch (error) {
      throw new Error(error);
    }
  }

  deleteKey(object, keys) {
    try {
      const last = keys.pop();
      delete keys.reduce((o, k) => o[k] !== undefined && o[k], object)[last];
      return object;
    } catch (error) {
      throw new Error(error);
    }
  }

  exclude(record, keysToExclude) {
    try {
      for (const [k, v] of keysToExclude.entries()) {
        this.deleteKey(record, v.split("."));
      }

      return record;
    } catch (error) {
      throw new Error(error);
    }
  }

  _except() {
    if (!this.copy.length) return;
    try {
      if (this.getQueryProp("_only")) {
        throw new Error(`'only' and 'except' cannot be used in the same query`);
      }
      const except = this.getQueryProp("_except");

      const keysToExclude = Array.isArray(except) ? except : [except];

      for (const record of this.copy) {
        this.exclude(record, keysToExclude);
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  _sort() {
    if (!this.copy.length) return;

    const compare = (a, b, dir) => {
      if (a < b) {
        return dir === -1 ? 1 : -1;
      }
      if (a > b) {
        return dir === -1 ? -1 : 1;
      }
      return 0;
    };

    console.log("this sort", this.queryObject);

    for (const sortKey in this.getQueryProp("_sort")) {
      this.copy.sort((a, b) =>
        compare(a[sortKey], b[sortKey], this.getQueryProp("_sort")[sortKey])
      );
    }
  }

  async _parseSearchable() {
    try {
      if (this.filtersObject) {
        this.copy = JSON.parse(JSON.stringify(this.data));

        this.copy = this.copy.filter((current) =>
          this.filterData(current, this.filtersObject)
        );
      }

      for (const fn of this.getQueue()) {
        this[fn]();
      }
      return this.copy;
    } catch (e) {
      throw new Error(e);
    }
  }

  async _parseUpdateMany() {
    console.log("FILTERS", this.getFiltersObject());
    console.log("data after update", this.getQueryProp("_set"));

    return this.data.map((record) => {
      if (this.filterData(record, this.getFiltersObject())) {
        console.log("RECORD PASSED FILTER", record);
        return this.mergeObjects([record, this.getQueryProp("_set")]);
      } else {
        return record;
      }
    });
  }

  async _parseUpdateOne() {
    let counter = 0;
    console.log("FILTERS", this.getFiltersObject());
    console.log("data after update", this.getQueryProp("_set"));

    return this.data.map((record) => {
      if (counter === 1) {
        return record;
      } else {
        if (this.filterData(record, this.getFiltersObject())) {
          const merged = this.mergeObjects([record, this.getQueryProp("_set")]);
          console.log("MERGED", merged);
          counter++;
          return merged;
        }
      }
    });
  }

  async _parseInsertable() {
    console.log("WHOLE", this);
    const f = this.getFiltersObject();

    console.log("inserting gi", f);

    // if we have a single object instead of an array of objects to save, we push that one object to a new array

    const arrToSave =
      "_save" in f && Array.isArray(f["_save"]) ? f["_save"] : [f];

    console.log("ARR TO SAVE", arrToSave);

    let lastId = this.data.length
      ? this.data[this.data.length - 1]["_id"] + 1
      : 1;

    arrToSave.forEach((el) => {
      el["_id"] = lastId;
      lastId++;
    });

    console.log("TO SAVE", arrToSave);
    return [...this.data, ...arrToSave];
  }

  async _parseDeleteOne() {
    console.log("PARSING DELETE ONE");
    let counter = 0;

    return this.data.filter((record) => {
      if (counter === 1) {
        return record;
      } else {
        if (this.filterData(record, this.getFiltersObject())) {
          console.log("_id", record["_id"]);
          counter++;
        }
      }
    });
  }

  async _parseDeleteMany() {
    return this.data.filter((record) => {
      if (!this.filterData(record, this.getFiltersObject())) {
        return record;
      }
    });
  }
};
