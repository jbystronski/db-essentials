const ErrorHandler = require("../errors/ErrorHandler");

module.exports = class Parser {
  constructor(params = null, bodyObject = null) {
    this.parserQueue = [];
    this.precedenceParsersQueue = [];
    this.afterParsersQueue = [];
    this.filtersObject = {};
    this.queryObject = {};
    this.bodyObject = bodyObject;
    this.params = params;

    this.parseFunctions = [
      "_date",
      "_nor",
      "_and",
      "_or",
      "_sort",
      "_limit",
      "_skip",
      "_only",
      "_except",
      "_set"
    ];

    this.precedenceParsers = ["_or", "_nor", "_and"];
    this.afterParsers = [
      "_date",
      "_sort",
      "_skip",
      "_limit",
      "_only",
      "_except",
      "_set"
    ];

    this.arrayKeywords = ["_in", "_not_in", "_only", "_except", "_array_all"];
  }

  getError(e) {
    return new ErrorHandler(e);
  }

  isOperator(k) {
    return k.startsWith("_") && k !== "_id";
  }

  isRegularObject(v) {
    try {
      return v !== null && v.constructor.name === "Object";
    } catch (e) {
      return this.getError(e);
    }
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
      return this.getError(e);
    }
  }

  isValueNumeric(str) {
    if (typeof str != "string") return false;
    return !isNaN(str) && !isNaN(parseFloat(str));
  }

  unstringify(v, k) {
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
      return this.getError(e);
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
      return this.getError(e);
    }
  };

  objectFromString(keyparts, value = {}) {
    return keyparts.reduceRight((acc, currentValue) => {
      return { [currentValue]: acc };
    }, value);
  }

  needsArray(k) {
    return this.arrayKeywords.includes(k);
  }

  paramParser(params, container = {}) {
    try {
      for (const [index, param] of params.entries()) {
        let [k, v] = param.split("=");
        const valueFromString = this.unstringify(v, k);
        let kparts = k.split(".");
        // console.log(kparts.reverse()[0]);
        // v = this.needsArray(kparts.reverse()[0]) ? v.split(",") : v;
        if (kparts.length === 1) {
          container[kparts[0]] = valueFromString;
        } else {
          if (["_nor", "_or", "_and"].includes(kparts[0])) {
            if (!container.hasOwnProperty(kparts[0])) {
              container[kparts[0]] = [];
            }

            container[kparts[0]] = [
              ...container[kparts[0]],
              this.objectFromString(kparts.slice(1), valueFromString)
            ];
          } else {
            container[kparts[0]] = this.mergeObjects([
              container[kparts[0]],
              this.objectFromString(kparts.slice(1), valueFromString)
            ]);
          }
        }
      }
      return container;
    } catch (e) {
      return this.getError(e);
    }
  }

  run() {
    try {
      if (this.params) {
        this.queryObject = this.paramParser(this.params);
        console.log("parsed", this.queryObject);
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

      // Object.keys(this.queryObject).forEach((k) => {
      //   this.afterParsers.includes(k) && this.afterParsersQueue.push(k);
      // });

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
      return this.getError(e);
    }
  }

  mergeObjects(objectsArr) {
    try {
      // Variables
      let target = {};

      let merger = (obj) => {
        for (let prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            if (
              Object.prototype.toString.call(obj[prop]) === "[object Object]"
            ) {
              // If we're doing a deep merge and the property is an object
              target[prop] = this.mergeObjects([target[prop], obj[prop]]);
            } else {
              // Otherwise, do a regular merge
              target[prop] = obj[prop];
            }
          }
        }
      };

      //Loop through each object and conduct a merge
      for (let i = 0; i < objectsArr.length; i++) {
        merger(objectsArr[i]);
      }

      return target;
    } catch (e) {
      return this.getError(e);
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
      return this.getError(e);
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
