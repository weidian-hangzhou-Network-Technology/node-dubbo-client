/**
 * This function is copy from https://github.com/unclechu/node-deep-extend
 */

function isSpecificValue(val) {
  return val instanceof Buffer || val instanceof Date || val instanceof RegExp;
}

function cloneSpecificValue(val) {
  if (val instanceof Buffer) {
    const x = new Buffer(val.length);
    val.copy(x);
    return x;
  } else if (val instanceof Date) {
    return new Date(val.getTime());
  } else if (val instanceof RegExp) {
    return new RegExp(val);
  } else {
    throw new Error('Unexpected situation');
  }
}

/**
 * Recursive cloning array.
 */
function deepCloneArray(arr) {
  const clone = [];
  arr.forEach((item, index) => {
    if (typeof item === 'object' && item !== null) {
      if (Array.isArray(item)) {
        clone[index] = deepCloneArray(item);
      } else if (isSpecificValue(item)) {
        clone[index] = cloneSpecificValue(item);
      } else {
        // eslint-disable-next-line no-use-before-define
        clone[index] = deepExtend({}, item);
      }
    } else {
      clone[index] = item;
    }
  });

  return clone;
}

const deepExtend = (target, ...objs) => {
  if (!target) {
    return;
  }

  if (objs.length < 1) {
    return target;
  }

  objs.forEach((obj) => {
    // skip argument if it is array or isn't object
    if (typeof obj !== 'object' || Array.isArray(obj)) {
      return;
    }

    Object.keys(obj).forEach((key) => {
      const src = target[key]; // source value
      const val = obj[key]; // new value

      if (val !== target) {
        if (typeof val !== 'object' || val === null) {
          target[key] = val;
        } else if (Array.isArray(val)) {
          target[key] = deepCloneArray(val);
        } else if (isSpecificValue(val)) {
          target[key] = cloneSpecificValue(val);
        } else if (typeof src !== 'object' || src === null || Array.isArray(src)) {
          target[key] = deepExtend({}, val);
        } else {
          target[key] = deepExtend(src, val);
        }
      }
    });
  });

  return target;
};

module.exports = deepExtend;
