const Registry = require('../../common/registry');
const Logger = require('../providerLog');

const registry = new Registry(Logger);

exports.init = (...arg) => registry.init(...arg);

exports.close = (invokers) => {
  let promises = [];
  invokers.forEach((invoker) => promises.push(registry.removeInvoker(invoker)));
  return Promise.all(promises).then(() => registry.close());
};

exports.register = (invoker) =>
  registry
    .getZookeeper()
    .then((client) => registry.registerInvoker(invoker, client))//注册消费者
    .then((info) => Logger.debug(info))
    .catch((err) => Promise.reject(err));
