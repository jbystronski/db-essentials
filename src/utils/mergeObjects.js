module.exports = function mergeObjects(objectsArr) {
  try {
    let target = {};

    let merger = (obj) => {
      for (let prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          if (Object.prototype.toString.call(obj[prop]) === "[object Object]") {
            target[prop] = mergeObjects([target[prop], obj[prop]]);
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
    console.error(e);
  }
};
