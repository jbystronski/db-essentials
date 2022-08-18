/*

  Builds an object from separated parts of a string, 
  value argument is the value of the deepmost key 

*/

module.exports = objectFromString = (keys, value = {}, separator = ".") => {
  if (!keys) return;
  keys = !Array.isArray(keys) ? keys.split(separator) : keys;

  return keys.reduceRight((acc, currentValue) => {
    return { [currentValue]: acc };
  }, value);
};
