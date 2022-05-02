const ParserError = require("./../errors/ParserError");

module.exports = class Parser {
  constructor(params = null, bodyObject = null) {
    this.parserQueue = [];
    this.filtersObject = {};
    this.queryObject = {};
    this.bodyObject = bodyObject;
    this.params = params;

    this.parserKeywords = {
      ASC: 1,
      DESC: -1
    };

    this.parseFunctions = [
      "_sort",
      "_limit",
      "_skip",
      "_only",
      "_except",
      "_set"
    ];
  }

  isOperator(k) {
    return k.startsWith("_") && k !== "_id";
  }

  isRegularObject(v) {
    try {
      return v !== null && v.constructor.name === "Object";
    } catch (error) {
      throw new Error(error);
    }
  }

  isType(v, type) {
    return (
      Object.prototype.toString.call(v).slice(8, -1).toLowerCase() === type
    );
  }

  isNestedProperty(key) {
    return key.split(".").length > 1;
  }

  parseNestedObject(key, value) {
    const objectKeys = key.split(".");

    function nestObjects(container, props, value, counter = 0) {
      if (props[counter + 1] === undefined) {
        container[props[counter]] = value;
        return container;
      }
      if (!container.hasOwnProperty(props[counter])) {
        container[props[counter]] = {};
      }

      nestObjects(container[props[counter]], props, value, ++counter);
    }

    nestObjects(this.queryObject, objectKeys, value);
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
        k &&
        ["_in", "_not_in", "_only", "_except"].includes(
          k.split(".").reverse()[0]
        );

      return forceToArray ? values : values[0];
    } catch (e) {
      console.error(e);
    }
  }

  _refitKeys = (object) => {
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
  };

  parseParams(params) {
    try {
      for (const [index, param] of params.entries()) {
        const [key, val] = param.split("=");
        const valueFromString = this.unstringify(val, key);

        switch (true) {
          case this.isNestedProperty(key):
            this.parseNestedObject(key, valueFromString);
            break;
          default:
            this.queryObject[key] = valueFromString;
        }
      }
    } catch (e) {
      throw new Error(e);
    }
  }

  run() {
    try {
      this.params && this.parseParams(this.params);

      console.log("BODY OBJECT", this.bodyObject);

      this.queryObject = this.bodyObject
        ? { ...this.queryObject, ...this.bodyObject }
        : this.queryObject;

      delete this.bodyObject;

      console.log("QUERY OBJECT", this.queryObject);

      Object.keys(this.queryObject).forEach((k) => {
        this.parseFunctions.includes(k) && this.parserQueue.push(k);
      });

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
      throw new ParserError(e);
    }
  }

  mergeObjects(objectsArr) {
    // Variables
    let target = {};

    let merger = (obj) => {
      for (let prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          if (Object.prototype.toString.call(obj[prop]) === "[object Object]") {
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
  }

  parametrizeBody(ob, q = "", queryParts = []) {
    console.log("object before parametrization", ob);

    for (const [k, v] of Object.entries(ob)) {
      console.log("parametrize body", k);
      if (v !== null && v.constructor.name === "Object") {
        this.parametrizeBody(ob[k], q + k + ".", queryParts);
      } else {
        queryParts.push(`${q}${k}=${v}`);
      }
    }
    console.log("queryParts", queryParts);
    return queryParts;
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
