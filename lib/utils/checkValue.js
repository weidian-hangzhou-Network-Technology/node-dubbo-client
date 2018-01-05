/**
 * check value exist
 * @param {Object} obj
 * @param {string} key
 */
module.exports = (obj, key) => {
  if (!obj) {
    throw new Error('service info should not be empty.');
  }

  if (obj[key] === undefined) {
    throw new Error(`${key} should not be null.`);
  }
};
