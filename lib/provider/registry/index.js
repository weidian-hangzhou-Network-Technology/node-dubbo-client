const Registry = require('../../common/registry');
const Logger = require('../providerLog');

const registry = new Registry(Logger);

exports.init = registry.init;

exports.close = registry.close;

exports.register = (invoker) => {
  // return registry
  //   .getZookeeper()
  //   .then((client) => registry.createInvoker(invoker, client))//注册消费者
  //   .catch((err) => {
  //     Logger.error(err.message);
  //     return Promise.reject(err);
  //   });
};
