const Registry = require('../../common/registry');
const Logger = require('../providerLog');

const registry = new Registry(Logger);

exports.init = (...arg) => registry.init(...arg);

exports.dispose = (invokers) =>
  Promise
    .all(invokers.map((invoker) => registry.removeInvoker(invoker)))
    .then(() => registry.close());

exports.register = (invoker) =>
  registry
    .getZookeeper()
    .then((client) => registry.registerInvoker(invoker, client))//注册提供者
    .then((info) => Logger.debug(info));
