const Parser = require("./Parser");

module.exports = class LocalParser extends Parser {
  constructor(params, body, data) {
    super(params, body);

    this.data = data;
    this.copy;

    this.reservedFilterKeywords = [
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
      "_type"
    ];
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
      this.getError(e);
    }
  }

  filterFunctions(fName, compare, value) {
    try {
      const fns = {
        _in: () => compare.includes(value),

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
          console.log("P", pattern);

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
      this.getError(e);
    }
  }

  getDataCopy() {
    return this.copy;
  }

  getAllObjectKeys(obj, container = [], previousKey = "") {
    try {
      Object.entries(obj).forEach(([key, values]) => {
        let keyRes = previousKey ? `${previousKey}.${key}` : key;
        if (this.isType(values, "object"))
          this.getAllObjectKeys(values, container, keyRes);

        container.push(keyRes);
      });

      return container;
    } catch (e) {
      this.getError(e);
    }
  }

  runInitialParsing() {
    try {
      this.setDataCopy();
      for (const fn of this.precedenceParsersQueue) {
        this[fn]();
      }
    } catch (e) {
      this.getError(e);
    }
  }

  setDataCopy() {
    this.copy = JSON.parse(JSON.stringify(this.data));
  }

  _and() {
    if (!this.copy.length) return;

    const and = this.getQueryProp("_and");

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

  _skip() {
    if (!this.copy.length) return;
    try {
      this.copy = this.copy.slice(this.getQueryProp("_skip"));
    } catch (e) {
      this.getError(e);
    }
  }

  modifyObjectProperty(src, ob, modifier) {
    return src.split(".").reduce((acc, prop) => {
      if (prop in acc) {
        if (!this.isType(acc[prop], "object")) {
          acc[prop] = this.isType(modifier, "function")
            ? modifier(acc[prop])
            : modifier;
        } else {
          return this.modifyObjectProperty(prop, acc[prop], modifier);
        }
      }
      return ob;
    }, ob);
  }

  _array_slice() {
    try {
      const [props, slice] = this.stringifyPath(
        this.getQueryProp("_array_slice")
      );

      this.copy = this.copy.map((rec) =>
        this.modifyObjectProperty(props, rec, (v) =>
          Array.isArray(v) ? v.slice(0, slice) : v
        )
      );
    } catch (e) {
      this.getError(e);
    }
  }

  _inc() {
    try {
      const [dottedProps, inc] = this.stringifyPath(this.getQueryProp("_inc"));

      this.copy = this.copy.map((rec) =>
        this.modifyObjectProperty(dottedProps, rec, (v) => v + inc)
      );
    } catch (e) {
      return this.getError(e);
    }
  }

  _cdate() {
    // TODO: check

    try {
      const [dottedProps, type] = this.stringifyPath(
        this.getQueryProp("_cdate")
      );

      const path = dottedProps.split(".").slice(0, -1).join(".");
      const date = type === "timestamp" ? Date.now() : new Date();

      this.copy = this.copy.map((rec) =>
        this.modifyObjectProperty(path, rec, date)
      );
    } catch (e) {
      this.getError(e);
    }
  }

  _limit() {
    if (!this.copy.length) return;
    try {
      this.copy = this.copy.slice(0, this.getQueryProp("_limit"));
    } catch (e) {
      this.getError(e);
    }
  }

  _slice() {
    if (!this.copy.length) return;
    const s = this.getQueryProp("_slice");
    try {
      this.copy = this.copy.slice(s[0], s[0] + s[1]);
    } catch (e) {
      this.getError(e);
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

  deleteKey(object, keys) {
    try {
      const last = keys.pop();
      delete keys.reduce((o, k) => o[k] !== undefined && o[k], object)[last];
      return object;
    } catch (e) {
      this.getError(e);
    }
  }

  _except() {
    if (!this.copy.length) return;
    try {
      if (this.getQueryProp("_only")) {
        throw new Error(`'only' and 'except' cannot be used in the same query`);
      }
      const except = this.getQueryProp("_except");

      for (const [k, v] of this.copy.entries()) {
        this.copy[k] = except.map((prop) =>
          this.deleteKey(v, prop.split("."))
        )[0];
      }
    } catch (e) {
      this.getError(e);
    }
  }

  _only() {
    if (!this.copy.length) return;
    try {
      if (this.getQueryProp("_except")) {
        throw new Error(`'only' and 'except' cannot be used in the same query`);
      }

      const only = this.getQueryProp("_only");

      only.push("_id");

      for (const [k, v] of this.copy.entries()) {
        this.copy[k] = only
          .map((prop) => this.copyObjectProperty(prop, v))
          .reduce((acc, curr) => this.mergeObjects([acc, curr]), {});
      }
    } catch (e) {
      this.getError(e);
    }
  }

  _or() {
    if (!this.copy.length) return;

    const or = this.getQueryProp("_or");

    const found = [];

    Array.isArray(or)
      ? or.forEach((condition) => {
          const match = this.copy.filter((r) =>
            this.filterData(r, condition).includes(true)
          );

          found.indexOf(...match) === -1 && found.push(...match);
        })
      : (found = this.copy.filter((r) =>
          this.filterData(r, or).includes(true)
        ));

    this.copy = found;
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

  parseFind() {
    try {
      this.runInitialParsing();

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
      this.getError(e);
    }
  }

  parseFindOne() {
    let found = false;

    try {
      this.runInitialParsing();
      for (const record of this.copy) {
        if (!this.filterData(record, this.filtersObject).includes(false)) {
          found = true;
          this.copy = [record];
          break;
        }
      }

      if (!found) {
        this.copy = null;
      }

      for (const fn of this.afterParsersQueue) {
        this[fn]();
      }

      return this.copy[0];
    } catch (e) {
      this.getError(e);
    }
  }

  mergeCopyAndOriginal() {
    try {
      const modifiedIndices = this.copy.reduce(
        (acc, rec) => [...acc, rec["_id"]],
        []
      );

      return this.data.reduce((acc, curr) => {
        !modifiedIndices.includes(curr["_id"])
          ? acc.push(curr)
          : acc.push(this.copy.find((el) => el["_id"] === curr["_id"]));

        return acc;
      }, []);
    } catch (e) {
      this.getError(e);
    }
  }

  parseUpdateMany() {
    try {
      this.runInitialParsing();

      let updatedCount = 0;

      this.copy = this.copy
        .map((record) => {
          if (
            !this.filterData(record, this.getFiltersObject()).includes(false)
          ) {
            updatedCount++;
            return this.mergeObjects([record, this.getQueryProp("_set")]);
          }
        })
        .filter((record) => !!record);

      for (const fn of this.afterParsersQueue) {
        this[fn]();
      }

      return [updatedCount, this.mergeCopyAndOriginal()];
    } catch (e) {
      this.getError(e);
    }
  }

  parseUpdateOne() {
    try {
      this.runInitialParsing();

      for (const record of this.copy) {
        if (!this.filterData(record, this.getFiltersObject()).includes(false)) {
          this.copy = [this.mergeObjects([record, this.getQueryProp("_set")])];

          break;
        }
      }

      for (const fn of this.afterParsersQueue) {
        this[fn]();
      }

      const updatedRecord = this.copy;

      return [updatedRecord, this.mergeCopyAndOriginal()];
    } catch (e) {
      this.getError(e);
    }
  }

  parseInsertable() {
    try {
      // if we have a single object instead of an array of objects to save, we push that one object to a new array
      const f = this.filtersObject;
      const arrToSave =
        "_save" in f && Array.isArray(f["_save"]) ? f["_save"] : [f];

      let lastId = this.data.length
        ? this.data[this.data.length - 1]["_id"] + 1
        : 1;

      arrToSave.forEach((el) => {
        el["_id"] = lastId;
        lastId++;
      });

      const merged = [...this.data, ...arrToSave];
      return [arrToSave, merged];
    } catch (e) {
      this.getError(e);
    }
  }

  parseDeleteOne() {
    try {
      this.runInitialParsing();
      let toDelete = null;

      for (const record of this.copy) {
        if (!this.filterData(record, this.getFiltersObject()).includes(false)) {
          const index = this.copy.indexOf(record);
          toDelete = this.copy[index];
          this.copy.splice(index, 1);

          break;
        }
      }

      return [toDelete, this.copy];
    } catch (e) {
      this.getError(e);
    }
  }

  parseDeleteMany() {
    try {
      this.runInitialParsing();

      let l = this.copy.length;
      const filtered = this.copy.filter((record) =>
        this.filterData(record, this.getFiltersObject()).includes(false)
      );

      const deleteCount = l - filtered.length;

      return [deleteCount, filtered];
    } catch (e) {
      this.getError(e);
    }
  }
};
