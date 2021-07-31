exports.noop = () => {};

const { toString } = Object.prototype;

exports.isBoolean = (param) => toString.call(param) === '[object Boolean]';

exports.isString = (param) => toString.call(param) === '[object String]';

exports.isNumber = (param) => toString.call(param) === '[object Number]';

exports.isMap = (param) => param instanceof Map;

exports.isFn = (param) => toString.call(param) === '[object Function]';

exports.isObj = (param) => toString.call(param) === '[object Object]';

exports.isRegExp = (param) => toString.call(param) === '[object RegExp]';

exports.isArray = (param) => toString.call(param) === '[object Array]';
