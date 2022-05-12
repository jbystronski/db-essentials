const ErrorHandler = require("../errors/ErrorHandler");

module.exports = class Parser {
  constructor(params = null, bodyObject = null) {
    this.afterParsersQueue = [];
    this.bodyObject = bodyObject;
    this.filtersObject = {};
    this.params = params;
    this.parserQueue = [];
    this.precedenceParsersQueue = [];
    this.queryObject = {};

    this.precedenceParsers = ["_or", "_nor", "_and"];
    this.afterParsers = [
      "_array_slice",
      "_cdate",
      "_except",
      "_inc",
      "_limit",
      "_only",
      "_skip",
      "_slice",
      "_sort"
    ];

    this.afterParsersPriority = {
      _sort: 1,
      _skip: 2,
      _limit: 3,
      _only: 4,
      _except: 4,
      _inc: 5,
      _cdate: 5,
      _slice: 5,
      _array_slice: 5
    };

    this.arrayKeywords = [
      "_array_all",
      "_except",
      "_in",
      "_not_in",
      "_only",
      "_slice"
    ];
  }

  getError(e, msg = null) {
    this.error = new ErrorHandler(e, {
      msg: msg
    });
  }
  isOperator(k) {
    return k.startsWith("_") && k !== "_id";
  }

  isRegularObject(v) {
    try {
      return v !== null && v.constructor.name === "Object";
    } catch (e) {
      this.getError(e);
    }
  }

  getObjectValue(keys, ob) {
    if (!keys) return;
    keys = !Array.isArray(keys) ? keys.split(".") : keys;

    return keys.reduce((p, c) => (p && p[c]) || null, ob);
  }

  copyObjectProperty(str, origin) {
    return this.objectFromString(str, this.getObjectValue(str, origin));
  }

  isType(v, type) {
    try {
      const checkType = (v, t) =>
        Object.prototype.toString.call(v).slice(8, -1).toLowerCase() === t;

      if (Array.isArray(type)) {
        let matches = [];

        matches = type.map((t) => checkType(v, t));

        return matches.includes(true) ? true : false;
      }

      return checkType(v, type);
    } catch (e) {
      this.getError(e);
    }
  }

  isValueNumeric(str) {
    if (typeof str != "string") return false;
    return !isNaN(str) && !isNaN(parseFloat(str));
  }

  parseValue(v, k) {
    if (typeof v !== "string") return v;

    // is value comma separated , if so turn into array
    try {
      const values = v.split(",");

      const patterns = {
        true: true,
        false: false,
        null: null,
        undefined: undefined
      };

      for (const [k, v] of values.entries()) {
        if (v in patterns) {
          values[k] = patterns[v];
        }

        // check if values are integers
        if (this.isValueNumeric(v)) {
          values[k] = parseFloat(v);
        }
      }

      const forceToArray =
        k && this.arrayKeywords.includes(k.split(".").reverse()[0]);

      return forceToArray ? values : values[0];
    } catch (e) {
      this.getError(e);
    }
  }

  _refitKeys = (object) => {
    try {
      return Array.isArray(object)
        ? object.map(this._refitKeys)
        : object && this.isRegularObject(object)
        ? Object.fromEntries(
            Object.entries(object).map(([k, v]) => [
              this.keywords.hasOwnProperty(k) ? this.keywords[k] : k,
              this._refitKeys(v)
            ])
          )
        : object;
    } catch (e) {
      this.getError(e);
    }
  };

  objectFromString(keys, value = {}) {
    if (!keys) return;
    keys = !Array.isArray(keys) ? keys.split(".") : keys;

    return keys.reduceRight((acc, currentValue) => {
      return { [currentValue]: acc };
    }, value);
  }

  needsArray(k) {
    return this.arrayKeywords.includes(k);
  }

  stringifyPath(obj, p = "") {
    const k = Object.keys(obj);

    return this.isType(obj[k], "object")
      ? this.stringifyPath(obj[k], p + k + ".")
      : [p + k, obj[k]];
  }

  paramParser(params, container = {}) {
    try {
      for (const [index, param] of params.entries()) {
        let [k, v] = param.split("=");
        const parsedValue = this.parseValue(v, k);
        let kparts = k.split(".");

        if (kparts.length === 1) {
          container[kparts[0]] = parsedValue;
        } else {
          if (["_nor", "_or", "_and"].includes(kparts[0])) {
            if (!container.hasOwnProperty(kparts[0])) {
              container[kparts[0]] = [];
            }

            container[kparts[0]] = [
              ...container[kparts[0]],
              this.objectFromString(kparts.slice(1), parsedValue)
            ];
          } else {
            container[kparts[0]] = this.mergeObjects([
              container[kparts[0]],
              this.objectFromString(kparts.slice(1), parsedValue)
            ]);
          }
        }
      }
      return container;
    } catch (e) {
      this.getError(e);
    }
  }

  run() {
    try {
      if (this.params) {
        this.queryObject = this.paramParser(this.params);
      }

      this.queryObject = this.bodyObject
        ? { ...this.queryObject, ...this.bodyObject }
        : this.queryObject;

      delete this.bodyObject;

      Object.keys(this.queryObject).forEach((k) => {
        this.precedenceParsers.includes(k) &&
          this.precedenceParsersQueue.push(k);

        this.afterParsers.includes(k) && this.afterParsersQueue.push(k);
      });

      this.reorderAfterParsers();

      // shift some functions from queries object to filters object
      for (const k of Object.keys(this.queryObject)) {
        if (k === "_save") {
          this.filtersObject[k] = JSON.parse(
            JSON.stringify(this.queryObject["_save"])
          );
          delete this.queryObject["_save"];
        } else if (!this.isOperator(k)) {
          this.filtersObject[k] = JSON.parse(
            JSON.stringify(this.queryObject[k])
          );
          delete this.queryObject[k];
        }
      }
    } catch (e) {
      this.getError(e);
    }
  }

  reorderAfterParsers() {
    try {
      this.afterParsersQueue.sort((a, b) =>
        this.afterParsersPriority[a] > this.afterParsersPriority[b] ? 1 : -1
      );
    } catch (e) {
      this.getError(e);
    }
  }

  mergeObjects(objectsArr) {
    try {
      let target = {};

      let merger = (obj) => {
        for (let prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            if (
              Object.prototype.toString.call(obj[prop]) === "[object Object]"
            ) {
              target[prop] = this.mergeObjects([target[prop], obj[prop]]);
            } else {
              target[prop] = obj[prop];
            }
          }
        }
      };

      for (let i = 0; i < objectsArr.length; i++) {
        merger(objectsArr[i]);
      }

      return target;
    } catch (e) {
      this.getError(e);
    }
  }

  parametrizeBody(ob, q = "", queryParts = []) {
    try {
      for (const [k, v] of Object.entries(ob)) {
        if (v !== null && v.constructor.name === "Object") {
          this.parametrizeBody(ob[k], q + k + ".", queryParts);
        } else {
          queryParts.push(`${q}${k}=${v}`);
        }
      }

      return queryParts;
    } catch (e) {
      this.getError(e);
    }
  }

  getQueue() {
    return this.parserQueue;
  }

  getQueryObject() {
    return this.queryObject;
  }

  getQueryProp(key) {
    return this.queryObject[key];
  }

  getFiltersObject() {
    return this.filtersObject;
  }

  clear() {
    this.queryObject = {};
    this.bodyObject = {};
  }
};
