function typeOf(obj) {
  const map = {
    '[object Boolean]': 'boolean',
    '[object Number]': 'number',
    '[object String]': 'string',
    '[object Function]': 'function',
    '[object Array]': 'array',
    '[object Date]': 'date',
    '[object RegExp]': 'regExp',
    '[object Undefined]': 'undefined',
    '[object Null]': 'null',
    '[object Object]': 'object',
  };
  return map[Object.prototype.toString.call(obj)];
}

function deepCopy(data) {
  const type = typeOf(data);
  let result;

  if (type === 'array') {
    result = [];
  } else if (type === 'object') {
    result = {};
  } else {
    return data;
  }

  if (type === 'array') {
    for (let i = 0; i < data.length; i++) {
      result.push(deepCopy(data[i]));
    }
  } else if (type === 'object') {
    Object
      .keys(data)
      .forEach((key) => {
        result[key] = deepCopy(data[key]);
      });
  }
  return result;
}

module.exports = deepCopy;
