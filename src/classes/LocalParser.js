const Parser = require("./Parser");
const ErrorHandler = require("../errors/ErrorHandler");

module.exports = class LocalParser extends Parser {
  constructor(params, body, data) {
    super(params, body);

    this.data = data;
    this.copy = [];

    this.reservedFilterKeywords = [
      "_contains",
      "_equals",
      "_in",
      "_not_equal",
      "_not_in",
      "_gt",
      "_gte",
      "_lt",
      "_lte",
      "_exists",
      "_type",
      "_regex",
      "_array_all",
      "_array_size",
      "_array_match",
      "_not"
    ];
  }

  filterFunctions(fName, compare, value) {
    console.log("function", fName);
    console.log("compare", compare);
    console.log("value", value);

    try {
      const fns = {
        _in: () => compare.includes(value),
        _contains: () => value.includes(compare),
        _not: () => {
          console.log("_not compare", compare);
          console.log("_not val", val);
        },
        _not_in: () => !compare.includes(value),
        _not_equal: () => value !== compare,
        _gt: () => value > compare,
        _lt: () => value < compare,
        _gte: () => value >= compare,
        _lte: () => value <= compare,
        _equals: () => value === compare,
        _type: () => this.isType(value, compare),
        _regex: () => {
          const split = compare.split("/").filter((el) => el !== "");

          const pattern = new RegExp(split[0], split[1]);

          return value.match(pattern);
        },
        _array_all: () => {
          if (Array.isArray(value) && Array.isArray(compare)) {
            return !compare
              .reduce(
                (acc, curr) =>
                  value.includes(curr) ? [...acc, true] : [...acc, false],
                []
              )
              .includes(false);
          }
          return false;
        },
        _array_size: () => {
          if (!Array.isArray(value)) {
            return false;
          }

          return value.length === compare;
        },
        _array_match: () => {
          return Array.isArray(value) && value.includes(compare);
        },
        _exists: () =>
          compare === true ? value !== undefined : value === undefined
      };

      return fns[fName]();
    } catch (e) {
      return this.getError(e);
    }
  }

  filterData(record, filters, parentKey, matches = []) {
    if (!Object.keys(filters).length) return [true];

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

      return matches;
    } catch (e) {
      return this.getError(e);
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
    } catch (e) {
      return this.getError(e);
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
    } catch (e) {
      return this.getError(e);
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
    } catch (e) {
      return this.getError(e);
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
    } catch (e) {
      return this.getError(e);
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
    } catch (e) {
      return this.getError(e);
    }
  }

  deleteKey(object, keys) {
    try {
      const last = keys.pop();
      delete keys.reduce((o, k) => o[k] !== undefined && o[k], object)[last];
      return object;
    } catch (e) {
      return this.getError(e);
    }
  }

  exclude(record, keysToExclude) {
    try {
      for (const [k, v] of keysToExclude.entries()) {
        this.deleteKey(record, v.split("."));
      }

      return record;
    } catch (e) {
      return this.getError(e);
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
    } catch (e) {
      return this.getError(e);
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

    for (const sortKey in this.getQueryProp("_sort")) {
      this.copy.sort((a, b) =>
        compare(a[sortKey], b[sortKey], this.getQueryProp("_sort")[sortKey])
      );
    }
  }

  _nor() {
    if (!this.copy.length) return;

    const nor = this.getQueryProp("_nor");

    Array.isArray(nor)
      ? nor.forEach((condition) => {
          this.copy = this.copy.filter(
            (rec) => !this.filterData(rec, condition).includes(true)
          );
        })
      : (this.copy = this.copy.filter(
          (rec) => !this.filterData(rec, nor).includes(true)
        ));
  }

  _and() {
    if (!this.copy.length) return;

    const and = this.getQueryProp("_and");

    console.log("copy in and", this.copy);

    Array.isArray(and)
      ? and.forEach((condition) => {
          this.copy = this.copy.filter(
            (r) => !this.filterData(r, condition).includes(false)
          );
        })
      : (this.copy = this.copy.filter(
          (r) => !this.filterData(r, and).includes(false)
        ));
  }

  _or() {
    if (!this.copy.length) return;

    const and = this.getQueryProp("_or");

    console.log("copy in or", this.copy);

    const found = [];

    Array.isArray(and)
      ? or.forEach((condition) => {
          const match = this.copy.filter((r) =>
            this.filterData(r, condition).includes(true)
          );

          found.indexOf(...match) === -1 && found.push(...match);
        })
      : (found = this.copy.filter((r) =>
          this.filterData(r, and).includes(true)
        ));

    this.copy = found;
  }

  _or() {
    if (!this.copy.length) return;

    this.copy = this.copy.filter((rec) =>
      this.filterData(rec, this.getQueryProp("_or")).includes(true)
    );
  }

  _date() {
    console.log(this.getQueryProp("_date"));
  }

  async _parseSearchable() {
    try {
      this.copy = JSON.parse(JSON.stringify(this.data));

      for (const fn of this.precedenceParsersQueue) {
        this[fn]();
      }

      if (this.filtersObject) {
        this.copy = this.copy.filter(
          (current) =>
            !this.filterData(current, this.filtersObject).includes(false)
        );
      }

      for (const fn of this.afterParsersQueue) {
        this[fn]();
      }
      return this.copy;
    } catch (e) {
      return this.getError(e);
    }
  }

  async _parseUpdateMany() {
    try {
      return this.data.map((record) => {
        if (!this.filterData(record, this.getFiltersObject()).includes(false)) {
          return this.mergeObjects([record, this.getQueryProp("_set")]);
        } else {
          return record;
        }
      });
    } catch (e) {
      return this.getError(e);
    }
  }

  async _parseUpdateOne() {
    try {
      let counter = 0;
      return this.data.map((record) => {
        if (counter === 1) {
          return record;
        } else {
          if (
            !this.filterData(record, this.getFiltersObject()).includes(false)
          ) {
            const merged = this.mergeObjects([
              record,
              this.getQueryProp("_set")
            ]);

            counter++;
            return merged;
          }
        }
      });
    } catch (e) {
      return this.getError(e);
    }
  }

  async _parseInsertable() {
    try {
      // if we have a single object instead of an array of objects to save, we push that one object to a new array

      const arrToSave =
        "_save" in f && Array.isArray(f["_save"]) ? f["_save"] : [f];

      let lastId = this.data.length
        ? this.data[this.data.length - 1]["_id"] + 1
        : 1;

      arrToSave.forEach((el) => {
        el["_id"] = lastId;
        lastId++;
      });

      return [...this.data, ...arrToSave];
    } catch (e) {
      return this.getError(e);
    }
  }

  async _parseDeleteOne() {
    try {
      let counter = 0;
      return this.data.filter((record) => {
        if (counter === 1) {
          return record;
        } else {
          if (
            !this.filterData(record, this.getFiltersObject()).includes(false)
          ) {
            counter++;
          }
        }
      });
    } catch (e) {
      return this.getError(e);
    }
  }

  async _parseDeleteMany() {
    try {
      return this.data.filter((record) => {
        if (this.filterData(record, this.getFiltersObject()).includes(false)) {
          return record;
        }
      });
    } catch (e) {
      return this.getError(e);
    }
  }
};
