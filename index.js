const config = require('./lib/config');
const registry = require('./lib/registry');
const logHelper = require('./lib/common/logHelper');
const provider = require('./lib/provider');

exports.config = (options) => {
  config.setOptions(options);
  return registry.init(config.getRegistry());
};

exports.dispose = () => {
  // if provider has been created,
  // it should use provider dispose function
  // provider need remove invoker and close server
  if (provider.called) {
    return provider.instances.dispose();
  }

  return registry.dispose();
};

exports.onLog = (calbak) => {
  logHelper.setLogger(calbak);
};

exports.consumer = require('./lib/consumer');

exports.provider = require('./lib/provider');
