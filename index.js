const config = require('./lib/config');
const registry = require('./lib/registry');
const logHelper = require('./lib/common/logHelper');

exports.config = (options) => {
  config.setOptions(options);
  return registry.init(config.getRegistry());
};

exports.dispose = () => registry.dispose();

exports.onLog = (calbak) => {
  logHelper.setLogger(calbak);
};

exports.consumer = require('./lib/consumer');

exports.provider = require('./lib/provider');
